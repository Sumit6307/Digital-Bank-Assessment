import pandas as pd
import numpy as np
from datetime import timedelta
from typing import Dict, Any, List, Optional
from app.services.data_manager import data_manager
from app.models.schemas import ForecastRequest, ForecastResponse, ForecastPoint

class ForecastingEngine:
    def __init__(self):
        pass

    def generate_forecast(self, req: ForecastRequest) -> ForecastResponse:
        df = data_manager.get_table(req.table_name)
        if df is None:
            raise ValueError(f"Table '{req.table_name}' not found.")

        if req.date_column not in df.columns or req.metric_column not in df.columns:
            raise ValueError(f"Specified date column or metric column does not exist in table.")

        # Clean and parse date & metric
        df_clean = df[[req.date_column, req.metric_column]].dropna().copy()
        df_clean[req.date_column] = pd.to_datetime(df_clean[req.date_column], errors="coerce")
        df_clean = df_clean.dropna(subset=[req.date_column])
        df_clean[req.metric_column] = pd.to_numeric(df_clean[req.metric_column], errors="coerce").fillna(0)

        # Aggregate by selected frequency (D, W, M)
        df_ts = df_clean.set_index(req.date_column).sort_index()
        freq_map = {"D": "D", "W": "W-MON", "M": "MS", "Y": "YS"}
        pandas_freq = freq_map.get(req.frequency.upper(), "D")
        
        aggregated = df_ts.resample(pandas_freq).sum().reset_index()

        if len(aggregated) < 3:
            raise ValueError("Not enough historical time-series points to generate a forecast (minimum 3 required).")

        # Historical points
        points: List[ForecastPoint] = []
        for _, row in aggregated.iterrows():
            d_str = row[req.date_column].strftime("%Y-%m-%d")
            val = float(row[req.metric_column])
            points.append(ForecastPoint(
                date=d_str,
                actual=round(val, 2),
                forecast=round(val, 2),
                lower_bound=round(val * 0.95, 2),
                upper_bound=round(val * 1.05, 2)
            ))

        # Forecasting using robust linear trend + seasonal dampening
        y = aggregated[req.metric_column].values
        x = np.arange(len(y))

        # Linear fit: y = mx + c
        poly = np.polyfit(x, y, 1)
        slope, intercept = poly[0], poly[1]
        
        # Residual standard error for confidence intervals
        y_pred_hist = np.polyval(poly, x)
        residuals = y - y_pred_hist
        std_err = float(np.std(residuals)) if len(residuals) > 1 else float(np.mean(y) * 0.1)

        last_date = aggregated[req.date_column].iloc[-1]
        horizon = min(max(req.horizon_periods, 1), 180)

        # Generate future points
        future_forecasts = []
        for i in range(1, horizon + 1):
            if req.frequency.upper() == "D":
                next_date = last_date + timedelta(days=i)
            elif req.frequency.upper() == "W":
                next_date = last_date + timedelta(weeks=i)
            elif req.frequency.upper() == "M":
                next_date = last_date + pd.DateOffset(months=i)
            else:
                next_date = last_date + pd.DateOffset(years=i)

            future_x = len(y) + i - 1
            pred_val = max(0.0, float(np.polyval(poly, future_x)))
            
            # Confidence interval widens with time horizon
            uncertainty_multiplier = 1.96 * (1.0 + (i / horizon) * 0.5)
            lower = max(0.0, float(pred_val - uncertainty_multiplier * std_err))
            upper = float(pred_val + uncertainty_multiplier * std_err)

            d_str = next_date.strftime("%Y-%m-%d")
            future_forecasts.append(pred_val)
            points.append(ForecastPoint(
                date=d_str,
                actual=None,
                forecast=round(pred_val, 2),
                lower_bound=round(lower, 2),
                upper_bound=round(upper, 2)
            ))

        # Trend and Growth analysis
        start_val = float(aggregated[req.metric_column].iloc[0])
        end_val = float(aggregated[req.metric_column].iloc[-1])
        growth_rate = round(((end_val - start_val) / start_val * 100.0) if start_val > 0 else 0.0, 2)

        if slope > 0.05 * np.mean(y):
            trend = "Strongly Upward"
        elif slope > 0:
            trend = "Moderately Upward"
        elif slope < -0.05 * np.mean(y):
            trend = "Strongly Downward"
        elif slope < 0:
            trend = "Moderately Downward"
        else:
            trend = "Stable / Flat"

        avg_future = float(np.mean(future_forecasts)) if future_forecasts else 0.0
        avg_past = float(np.mean(y)) if len(y) > 0 else 1.0
        projected_growth = round(((avg_future - avg_past) / avg_past * 100.0), 1)

        summary = (
            f"The time-series shows a **{trend}** trajectory with a historical growth of {growth_rate}% "
            f"across {len(aggregated)} periods. The {horizon}-period projection anticipates an average "
            f"`{req.metric_column}` of {avg_future:,.2f} ({projected_growth:+0.1f}% relative to historical mean)."
        )

        return ForecastResponse(
            metric_column=req.metric_column,
            date_column=req.date_column,
            historical_count=len(aggregated),
            forecast_count=horizon,
            trend_direction=trend,
            growth_rate_pct=growth_rate,
            points=points,
            summary_insight=summary
        )

forecasting_engine = ForecastingEngine()
