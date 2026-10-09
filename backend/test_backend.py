import os
import sys
import pytest
import pandas as pd

# Add current path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.data_manager import data_manager
from app.services.query_engine import query_engine
from app.services.anomaly_detector import anomaly_detector
from app.services.forecasting_engine import forecasting_engine
from app.services.dashboard_service import dashboard_service
from app.services.llm_agent import ai_agent
from app.models.schemas import ChatRequest, ForecastRequest

def test_data_manager_sample_loading():
    sample_dir = os.path.join(os.path.dirname(__file__), "sample_data")
    assert os.path.exists(sample_dir), "Sample data directory missing"
    
    for fname in os.listdir(sample_dir):
        if fname.endswith(".csv"):
            df = pd.read_csv(os.path.join(sample_dir, fname))
            tbl = data_manager.sanitize_table_name(fname)
            data_manager.load_dataframe(tbl, df)

    tables = data_manager.get_all_tables()
    assert "sales_transactions" in tables
    assert "customers" in tables
    assert "products" in tables
    assert len(tables["sales_transactions"]) > 100

def test_duckdb_sql_execution():
    sql = "SELECT region, SUM(sales_amount) as total_sales FROM sales_transactions GROUP BY region ORDER BY total_sales DESC"
    records, cols, duration, err = query_engine.execute_sql(sql)
    assert err is None
    assert len(records) > 0
    assert "region" in cols
    assert "total_sales" in cols
    print(f"SQL Test Passed: {records[0]}")

def test_multi_table_sql_join():
    sql = """
    SELECT c.customer_name, SUM(s.sales_amount) as total_spend, COUNT(s.transaction_id) as orders
    FROM customers c
    JOIN sales_transactions s ON c.customer_id = s.customer_id
    GROUP BY c.customer_name
    ORDER BY total_spend DESC
    LIMIT 5
    """
    records, cols, duration, err = query_engine.execute_sql(sql)
    assert err is None
    assert len(records) == 5
    assert "customer_name" in records[0]

def test_python_sandbox_execution():
    code = """
result_df = sales_transactions.groupby('region')['profit'].mean().reset_index()
"""
    records, stdout, duration, err = query_engine.execute_python_sandbox(code)
    assert err is None
    assert records is not None
    assert len(records) > 0

def test_anomaly_detector():
    res = anomaly_detector.detect_anomalies("sales_transactions", method="isolation_forest", contamination=0.03)
    assert res.anomalies_found > 0
    assert len(res.anomalies) > 0
    assert len(res.anomalies[0].explanation) > 5
    print(f"Anomaly Test Passed: Found {res.anomalies_found} outliers. Top explanation: {res.anomalies[0].explanation}")

def test_forecasting_engine():
    req = ForecastRequest(
        table_name="sales_transactions",
        date_column="date",
        metric_column="sales_amount",
        horizon_periods=30,
        frequency="D"
    )
    res = forecasting_engine.generate_forecast(req)
    assert res.forecast_count == 30
    assert len(res.points) > 30
    assert res.trend_direction in ["Strongly Upward", "Moderately Upward", "Strongly Downward", "Moderately Downward", "Stable / Flat"]

def test_dashboard_service():
    res = dashboard_service.generate_dashboard()
    assert len(res.kpis) >= 3
    assert len(res.charts) >= 2
    assert len(res.executive_summary) > 20

def test_ai_agent_core_questions():
    questions = [
        "Which region generated the highest revenue?",
        "Show monthly sales trends.",
        "Which products are underperforming?",
        "What are the top five customers?",
        "Generate SQL for this analysis.",
        "Detect anomalies in the dataset."
    ]

    for q in questions:
        req = ChatRequest(message=q)
        resp = ai_agent.process_query(req)
        assert resp.answer is not None and len(resp.answer) > 0
        assert len(resp.reasoning_steps) > 0
        assert resp.generated_sql or resp.generated_python or resp.data_table
        print(f"Verified Agent Query: '{q}' -> Generated SQL: {resp.generated_sql[:40] if resp.generated_sql else 'N/A'}")

if __name__ == "__main__":
    pytest.main(["-v", "backend/test_backend.py"])
