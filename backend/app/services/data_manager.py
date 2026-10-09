import io
import re
import duckdb
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from app.models.schemas import (
    TableSchema, ColumnProfile, DataQualityMetric, 
    JoinRelationship, DatasetOverview
)

class DataManager:
    def __init__(self):
        self.tables: Dict[str, pd.DataFrame] = {}
        self.db = duckdb.connect(database=":memory:")
        self.loaded_at: str = datetime.now().isoformat()

    def sanitize_table_name(self, filename: str) -> str:
        # Strip extension and sanitize to valid SQL identifier
        base = filename.rsplit(".", 1)[0]
        cleaned = re.sub(r"[^a-zA-Z0-9_]", "_", base).lower()
        if not cleaned or cleaned[0].isdigit():
            cleaned = f"t_{cleaned}"
        return cleaned

    def sanitize_column_name(self, col: str) -> str:
        cleaned = re.sub(r"[^\w]", "_", str(col).strip()).lower()
        return cleaned if cleaned else "col"

    def load_csv_bytes(self, filename: str, content: bytes) -> str:
        table_name = self.sanitize_table_name(filename)
        encodings = ["utf-8", "latin1", "iso-8859-1", "cp1252"]
        df = None

        for enc in encodings:
            try:
                # Try reading with automatic delimiter detection
                df = pd.read_csv(io.BytesIO(content), encoding=enc, sep=None, engine="python")
                break
            except Exception:
                try:
                    df = pd.read_csv(io.BytesIO(content), encoding=enc)
                    break
                except Exception:
                    continue

        if df is None:
            raise ValueError(f"Could not parse CSV file '{filename}'. Please ensure it is a valid CSV format.")

        # Clean column names
        df.columns = [self.sanitize_column_name(c) for c in df.columns]

        # Auto-detect dates
        for col in df.columns:
            if df[col].dtype == "object":
                # Sample non-null values
                sample = df[col].dropna().astype(str).head(50)
                if len(sample) > 0 and sample.str.match(r"^\d{4}[-/]\d{1,2}[-/]\d{1,2}").mean() > 0.7:
                    try:
                        df[col] = pd.to_datetime(df[col], errors="ignore")
                    except Exception:
                        pass

        self.tables[table_name] = df
        self.db.register(table_name, df)
        self.loaded_at = datetime.now().isoformat()
        return table_name

    def load_dataframe(self, table_name: str, df: pd.DataFrame):
        table_name = self.sanitize_table_name(table_name)
        df.columns = [self.sanitize_column_name(c) for c in df.columns]
        self.tables[table_name] = df
        self.db.register(table_name, df)
        self.loaded_at = datetime.now().isoformat()

    def get_table(self, table_name: str) -> Optional[pd.DataFrame]:
        return self.tables.get(table_name)

    def get_all_tables(self) -> Dict[str, pd.DataFrame]:
        return self.tables

    def clear(self):
        for t in list(self.tables.keys()):
            try:
                self.db.unregister(t)
            except Exception:
                pass
        self.tables.clear()

    def profile_column(self, series: pd.Series) -> ColumnProfile:
        total = len(series)
        null_count = int(series.isnull().sum())
        non_null_count = total - null_count
        null_pct = round((null_count / total * 100.0) if total > 0 else 0.0, 2)
        unique_cnt = int(series.nunique(dropna=True))

        is_num = pd.api.types.is_numeric_dtype(series)
        is_dt = pd.api.types.is_datetime64_any_dtype(series)
        is_cat = (not is_num) and (not is_dt) and (unique_cnt <= min(50, total * 0.5))

        sample_vals = series.dropna().head(5).tolist()
        sample_vals = [str(x) if isinstance(x, (pd.Timestamp, datetime, np.datetime64)) else x for x in sample_vals]

        stats = {}
        if is_num and non_null_count > 0:
            clean = series.dropna()
            stats = {
                "min": float(clean.min()),
                "max": float(clean.max()),
                "mean": round(float(clean.mean()), 4),
                "std": round(float(clean.std()), 4) if len(clean) > 1 else 0.0,
                "median": float(clean.median()),
                "q25": float(clean.quantile(0.25)),
                "q75": float(clean.quantile(0.75))
            }

        dtype_str = str(series.dtype)
        if is_dt:
            dtype_str = "datetime"
        elif is_num:
            dtype_str = "numeric" if "float" in dtype_str else "integer"

        return ColumnProfile(
            name=str(series.name),
            dtype=dtype_str,
            non_null_count=non_null_count,
            null_count=null_count,
            null_percentage=null_pct,
            unique_count=unique_cnt,
            sample_values=sample_vals,
            is_numeric=is_num,
            is_datetime=is_dt,
            is_categorical=is_cat,
            stats=stats
        )

    def get_table_schema(self, table_name: str) -> Optional[TableSchema]:
        df = self.tables.get(table_name)
        if df is None:
            return None

        columns_profile = [self.profile_column(df[col]) for col in df.columns]
        
        # Clean preview data for JSON serialization (convert Timestamps & NaN/Inf)
        preview_df = df.head(10).copy()
        for col in preview_df.columns:
            if pd.api.types.is_datetime64_any_dtype(preview_df[col]):
                preview_df[col] = preview_df[col].astype(str)
        
        preview_data = preview_df.replace({np.nan: None, np.inf: None, -np.inf: None}).to_dict(orient="records")

        # Detect potential primary key candidates
        detected_keys = []
        for col in df.columns:
            if df[col].nunique() == len(df) and len(df) > 0 and not df[col].isnull().any():
                detected_keys.append(col)

        return TableSchema(
            table_name=table_name,
            row_count=len(df),
            column_count=len(df.columns),
            columns=columns_profile,
            preview_data=preview_data,
            detected_keys=detected_keys
        )

    def detect_relationships(self) -> List[JoinRelationship]:
        relationships = []
        table_names = list(self.tables.keys())
        if len(table_names) < 2:
            return relationships

        for i in range(len(table_names)):
            for j in range(i + 1, len(table_names)):
                t1 = table_names[i]
                t2 = table_names[j]
                df1 = self.tables[t1]
                df2 = self.tables[t2]

                for c1 in df1.columns:
                    for c2 in df2.columns:
                        # Direct name match or key match (e.g., customer_id and id or customer_id)
                        name_match = (c1 == c2) or (c1.endswith(f"_{c2}")) or (c2.endswith(f"_{c1}"))
                        if name_match:
                            s1 = set(df1[c1].dropna().astype(str).unique())
                            s2 = set(df2[c2].dropna().astype(str).unique())
                            if s1 and s2:
                                overlap = len(s1.intersection(s2))
                                union = len(s1.union(s2))
                                jaccard = overlap / union if union > 0 else 0.0

                                if jaccard > 0.2 or (overlap > 0 and (overlap == len(s1) or overlap == len(s2))):
                                    cardinality = "1:N" if len(s1) != len(df1) and len(s2) == len(df2) else ("N:1" if len(s1) == len(df1) else "N:N")
                                    relationships.append(JoinRelationship(
                                        table_a=t1,
                                        column_a=c1,
                                        table_b=t2,
                                        column_b=c2,
                                        confidence=round(max(jaccard, 0.85), 2),
                                        match_cardinality=cardinality
                                    ))
        return relationships

    def compute_data_quality(self, table_name: Optional[str] = None) -> DataQualityMetric:
        if table_name and table_name in self.tables:
            dfs = {table_name: self.tables[table_name]}
        else:
            dfs = self.tables

        if not dfs:
            return DataQualityMetric(
                overall_health_score=100.0,
                total_rows=0,
                total_columns=0,
                total_nulls=0,
                null_cell_percentage=0.0,
                duplicate_rows_count=0,
                duplicate_percentage=0.0,
                column_issues=[],
                recommendations=["Upload a dataset to evaluate data quality."]
            )

        total_rows = sum(len(df) for df in dfs.values())
        total_cols = sum(len(df.columns) for df in dfs.values())
        total_cells = sum(df.size for df in dfs.values())
        total_nulls = sum(int(df.isnull().sum().sum()) for df in dfs.values())
        total_duplicates = sum(int(df.duplicated().sum()) for df in dfs.values())

        null_cell_pct = round((total_nulls / total_cells * 100.0) if total_cells > 0 else 0.0, 2)
        duplicate_pct = round((total_duplicates / total_rows * 100.0) if total_rows > 0 else 0.0, 2)

        column_issues = []
        recommendations = []

        for t_name, df in dfs.items():
            for col in df.columns:
                n_nulls = int(df[col].isnull().sum())
                pct_null = (n_nulls / len(df) * 100.0) if len(df) > 0 else 0
                if pct_null > 20.0:
                    column_issues.append({
                        "table": t_name,
                        "column": col,
                        "issue_type": "High Missing Values",
                        "severity": "High" if pct_null > 50 else "Medium",
                        "details": f"{pct_null:.1f}% missing ({n_nulls}/{len(df)} rows)"
                    })
                
                # Check for single value / zero variance columns
                if df[col].nunique() == 1 and len(df) > 1:
                    column_issues.append({
                        "table": t_name,
                        "column": col,
                        "issue_type": "Constant Column",
                        "severity": "Low",
                        "details": "Column has only 1 distinct value with 0 variance."
                    })

        # Calculate overall health score (0 - 100)
        penalty = (null_cell_pct * 1.5) + (duplicate_pct * 2.0) + (len(column_issues) * 3.0)
        health_score = max(5.0, round(100.0 - penalty, 1))

        if null_cell_pct > 10:
            recommendations.append(f"Consider imputing or handling missing values in columns with >10% nulls.")
        if duplicate_pct > 0:
            recommendations.append(f"Found {total_duplicates} duplicate records ({duplicate_pct}%). Review and deduplicate if necessary.")
        if not recommendations:
            recommendations.append("Dataset cleanliness is excellent! Ready for high-precision analytical querying.")

        return DataQualityMetric(
            overall_health_score=health_score,
            total_rows=total_rows,
            total_columns=total_cols,
            total_nulls=total_nulls,
            null_cell_percentage=null_cell_pct,
            duplicate_rows_count=total_duplicates,
            duplicate_percentage=duplicate_pct,
            column_issues=column_issues,
            recommendations=recommendations
        )

    def get_dataset_overview(self) -> DatasetOverview:
        tables_meta = []
        for t_name in self.tables.keys():
            schema = self.get_table_schema(t_name)
            if schema:
                tables_meta.append(schema)

        relationships = self.detect_relationships()
        quality = self.compute_data_quality()

        return DatasetOverview(
            tables=tables_meta,
            relationships=relationships,
            data_quality=quality,
            loaded_at=self.loaded_at
        )

    def get_compact_schema_prompt(self) -> str:
        """Returns a clean concise schema description suitable for LLM context prompts"""
        if not self.tables:
            return "No tables currently loaded."

        lines = ["Database Schema (DuckDB SQL & Pandas DataFrames available):"]
        for t_name, df in self.tables.items():
            lines.append(f"\nTable: `{t_name}` ({len(df)} rows, {len(df.columns)} columns)")
            col_descs = []
            for col in df.columns:
                dtype = str(df[col].dtype)
                sample = df[col].dropna().head(3).tolist()
                sample_str = ", ".join([str(x) for x in sample])
                col_descs.append(f"  - `{col}` ({dtype}) [Samples: {sample_str}]")
            lines.extend(col_descs)

        relationships = self.detect_relationships()
        if relationships:
            lines.append("\nDetected Foreign Key Relationships (Use for JOINs):")
            for rel in relationships:
                lines.append(f"  - `{rel.table_a}`.{rel.column_a} <-> `{rel.table_b}`.{rel.column_b} ({rel.match_cardinality})")

        return "\n".join(lines)

# Singleton global instance
data_manager = DataManager()
