import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional
from sklearn.ensemble import IsolationForest
from app.services.data_manager import data_manager
from app.models.schemas import AnomalyItem, AnomalyDetectionResponse

class AnomalyDetector:
    def __init__(self):
        pass

    def detect_anomalies(
        self, 
        table_name: str, 
        method: str = "isolation_forest", 
        contamination: float = 0.03,
        columns: Optional[List[str]] = None
    ) -> AnomalyDetectionResponse:
        df = data_manager.get_table(table_name)
        if df is None or len(df) == 0:
            return AnomalyDetectionResponse(
                table_name=table_name,
                method_used=method,
                total_records=0,
                anomalies_found=0,
                anomaly_percentage=0.0,
                anomalies=[],
                distribution_summary={},
                recommendation="No data available for anomaly detection."
            )

        # Select numeric columns
        if columns:
            num_cols = [c for c in columns if c in df.columns and pd.api.types.is_numeric_dtype(df[c])]
        else:
            num_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]

        if not num_cols:
            return AnomalyDetectionResponse(
                table_name=table_name,
                method_used=method,
                total_records=len(df),
                anomalies_found=0,
                anomaly_percentage=0.0,
                anomalies=[],
                distribution_summary={},
                recommendation="No numeric columns found in the dataset to perform anomaly detection."
            )

        df_num = df[num_cols].fillna(df[num_cols].median())
        anomalies_list: List[AnomalyItem] = []
        scores = np.zeros(len(df))

        # Compute column statistics for explanations
        col_stats = {}
        for c in num_cols:
            col_stats[c] = {
                "mean": float(df_num[c].mean()),
                "std": float(df_num[c].std()) if len(df_num[c]) > 1 and df_num[c].std() > 0 else 1.0,
                "median": float(df_num[c].median()),
                "q25": float(df_num[c].quantile(0.25)),
                "q75": float(df_num[c].quantile(0.75)),
                "iqr": float(df_num[c].quantile(0.75) - df_num[c].quantile(0.25))
            }

        if method == "isolation_forest" and len(df) >= 10:
            clf = IsolationForest(contamination=max(0.01, min(contamination, 0.2)), random_state=42)
            preds = clf.fit_predict(df_num)
            raw_scores = -clf.decision_function(df_num)  # higher = more anomalous
            # Normalize scores to 0 - 100
            min_s, max_s = raw_scores.min(), raw_scores.max()
            norm_scores = ((raw_scores - min_s) / (max_s - min_s + 1e-9)) * 100.0 if max_s > min_s else np.zeros(len(df))

            anomaly_indices = np.where(preds == -1)[0]

        elif method == "z_score":
            z_matrix = np.abs((df_num - df_num.mean()) / (df_num.std().replace(0, 1)))
            max_z = z_matrix.max(axis=1)
            norm_scores = np.clip(max_z * 20.0, 0, 100)
            threshold = 3.0
            anomaly_indices = np.where(max_z > threshold)[0]

        else:  # IQR Method
            iqr_flags = pd.DataFrame(False, index=df.index, columns=num_cols)
            for c in num_cols:
                q25 = col_stats[c]["q25"]
                q75 = col_stats[c]["q75"]
                iqr = col_stats[c]["iqr"]
                lower = q25 - 1.5 * iqr
                upper = q75 + 1.5 * iqr
                iqr_flags[c] = (df_num[c] < lower) | (df_num[c] > upper)

            anomaly_indices = np.where(iqr_flags.any(axis=1))[0]
            norm_scores = iqr_flags.sum(axis=1) * 30.0

        # Build detailed human-understandable explanation for each flagged anomaly
        for idx in anomaly_indices:
            row = df.iloc[idx]
            flagged_cols = []
            explanations = []

            for c in num_cols:
                val = float(df_num.iloc[idx][c])
                stat = col_stats[c]
                z_val = abs(val - stat["mean"]) / (stat["std"] if stat["std"] > 0 else 1.0)
                iqr = stat["iqr"]
                is_outlier = False

                if z_val > 2.5 or (iqr > 0 and (val < stat["q25"] - 1.5 * iqr or val > stat["q75"] + 1.5 * iqr)):
                    is_outlier = True
                    flagged_cols.append(c)
                    ratio = val / stat["mean"] if stat["mean"] != 0 else z_val
                    direction = "significantly higher" if val > stat["mean"] else "significantly lower"
                    explanations.append(
                        f"Column `{c}` value ({val:,.2f}) is {direction} than the mean ({stat['mean']:,.2f}) by {z_val:.1f} standard deviations"
                    )

            if not flagged_cols:
                # Multivariate interaction anomaly
                flagged_cols = num_cols[:2]
                explanations.append(f"Unusual combination of values across correlated dimensions ({', '.join(flagged_cols)})")

            # Clean record for JSON
            record_dict = row.replace({np.nan: None, np.inf: None, -np.inf: None}).to_dict()
            for k, v in record_dict.items():
                if isinstance(v, (pd.Timestamp, np.datetime64)):
                    record_dict[k] = str(v)

            anomalies_list.append(AnomalyItem(
                row_index=int(idx),
                record=record_dict,
                anomaly_score=round(float(norm_scores[idx]), 1),
                flagged_columns=flagged_cols,
                explanation="; ".join(explanations)
            ))

        # Sort by anomaly score descending
        anomalies_list.sort(key=lambda x: x.anomaly_score, reverse=True)

        # Build distribution summary
        dist_summary = {
            col: {
                "mean": round(col_stats[col]["mean"], 2),
                "median": round(col_stats[col]["median"], 2),
                "std": round(col_stats[col]["std"], 2),
                "min": round(col_stats[col]["q25"] - 1.5 * col_stats[col]["iqr"], 2),
                "max": round(col_stats[col]["q75"] + 1.5 * col_stats[col]["iqr"], 2)
            }
            for col in num_cols
        }

        total_anomalies = len(anomalies_list)
        anomaly_pct = round((total_anomalies / len(df) * 100.0), 2) if len(df) > 0 else 0.0

        if total_anomalies == 0:
            rec = "No statistical anomalies detected. Data distributions are well within expected variances."
        elif anomaly_pct > 10:
            rec = f"High outlier density ({anomaly_pct}%). Consider applying robust scaling or investigating data collection pipelines."
        else:
            rec = f"Found {total_anomalies} noteworthy outlier records ({anomaly_pct}%). Review the flagged transactions/entities for potential data entry errors, fraudulent spikes, or operational extremes."

        return AnomalyDetectionResponse(
            table_name=table_name,
            method_used=method.replace("_", " ").title(),
            total_records=len(df),
            anomalies_found=total_anomalies,
            anomaly_percentage=anomaly_pct,
            anomalies=anomalies_list[:100],  # Return top 100
            distribution_summary=dist_summary,
            recommendation=rec
        )

# Global singleton anomaly detector
anomaly_detector = AnomalyDetector()
