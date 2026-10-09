import sys
import io
import time
import duckdb
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from app.services.data_manager import data_manager

class QueryEngine:
    def __init__(self):
        pass

    def _clean_for_json(self, data: Any) -> Any:
        """Recursively clean data structures to make them strictly JSON compliant"""
        if isinstance(data, dict):
            return {str(k): self._clean_for_json(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._clean_for_json(v) for v in data]
        elif isinstance(data, (np.integer, np.int64, np.int32)):
            return int(data)
        elif isinstance(data, (np.floating, np.float64, np.float32)):
            if np.isnan(data) or np.isinf(data):
                return None
            return round(float(data), 4)
        elif isinstance(data, float):
            if np.isnan(data) or np.isinf(data):
                return None
            return round(data, 4)
        elif isinstance(data, (pd.Timestamp, np.datetime64, pd.Period)):
            return str(data)
        elif pd.isna(data):
            return None
        elif not isinstance(data, (str, int, float, bool, type(None))):
            return str(data)
        return data

    def execute_sql(self, query: str, limit: int = 500) -> Tuple[List[Dict[str, Any]], List[str], float, Optional[str]]:
        """
        Executes a SQL query against DuckDB tables.
        Returns (records, column_names, execution_time, error_message)
        """
        start_time = time.time()
        try:
            # Clean up query
            cleaned_query = query.strip().rstrip(";")
            
            # Execute with DuckDB
            rel = data_manager.db.sql(cleaned_query)
            if rel is None:
                return [], [], round(time.time() - start_time, 4), None

            df_result = rel.limit(limit).df()
            duration = round(time.time() - start_time, 4)

            # Format datetime columns as string for JSON serialization
            for col in df_result.columns:
                if pd.api.types.is_datetime64_any_dtype(df_result[col]):
                    df_result[col] = df_result[col].astype(str)

            # Convert to dict records
            records = df_result.replace({np.nan: None, np.inf: None, -np.inf: None}).to_dict(orient="records")
            clean_records = self._clean_for_json(records)
            columns = list(df_result.columns)

            return clean_records, columns, duration, None

        except Exception as e:
            duration = round(time.time() - start_time, 4)
            return [], [], duration, str(e)

    def execute_python_sandbox(self, code_str: str) -> Tuple[Optional[List[Dict[str, Any]]], str, float, Optional[str]]:
        """
        Safely executes Python pandas code in an isolated scope.
        The scope includes `tables` (dict of dfs), `pd`, `np`, `duckdb`, and each dataframe as a variable.
        Returns (result_records, stdout_str, duration, error_message)
        """
        start_time = time.time()
        
        # Capture stdout
        old_stdout = sys.stdout
        redirected_output = io.StringIO()
        sys.stdout = redirected_output

        # Build safe local environment
        local_scope = {
            "pd": pd,
            "np": np,
            "duckdb": duckdb,
            "tables": data_manager.tables,
            "result_df": None,
            "result": None
        }
        # Add tables directly as variables (e.g. sales_transactions)
        for t_name, df in data_manager.tables.items():
            local_scope[t_name] = df.copy()

        error_msg = None
        result_records = None

        try:
            # Strip markdown if present
            clean_code = code_str
            if "```python" in clean_code:
                clean_code = clean_code.split("```python")[1].split("```")[0]
            elif "```" in clean_code:
                clean_code = clean_code.split("```")[1].split("```")[0]

            # Execute
            exec(clean_code, {}, local_scope)

            # Extract result safely without bool(df) evaluation
            res = local_scope.get("result_df")
            if res is None:
                res = local_scope.get("result")

            if isinstance(res, pd.DataFrame):
                # Clean datetime columns
                res_clean = res.copy()
                for col in res_clean.columns:
                    if pd.api.types.is_datetime64_any_dtype(res_clean[col]):
                        res_clean[col] = res_clean[col].astype(str)
                records = res_clean.head(500).replace({np.nan: None, np.inf: None, -np.inf: None}).to_dict(orient="records")
                result_records = self._clean_for_json(records)
            elif isinstance(res, (dict, list)):
                result_records = self._clean_for_json(res)
            elif isinstance(res, (pd.Series)):
                res_df = res.reset_index()
                result_records = self._clean_for_json(res_df.to_dict(orient="records"))

        except Exception as e:
            error_msg = str(e)
        finally:
            sys.stdout = old_stdout

        duration = round(time.time() - start_time, 4)
        stdout_output = redirected_output.getvalue()

        return result_records, stdout_output, duration, error_msg

# Global singleton query engine
query_engine = QueryEngine()
