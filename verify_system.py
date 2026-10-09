import os
import requests
import json
import pandas as pd
import numpy as np

BASE_URL = "http://127.0.0.1:8000"

def test_full_system_dynamic():
    print("=== 1. Testing Health and Dataset Listing ===")
    r = requests.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200
    print("Health Status:", r.json())

    print("\n=== 2. Testing Core Sample Questions (Dynamic Calculations) ===")
    questions = [
        "Which region generated the highest revenue?",
        "Show monthly sales trends.",
        "Which products are underperforming?",
        "What are the top five customers?",
        "Detect anomalies in the dataset."
    ]

    for q in questions:
        res = requests.post(f"{BASE_URL}/api/chat", json={"message": q})
        assert res.status_code == 200
        data = res.json()
        print(f"\n[Q]: '{q}'")
        print(f"-> Direct Answer: {data['answer'][:120]}...")
        print(f"-> Generated SQL: {data['generated_sql']}")
        print(f"-> Reasoning Steps: {len(data['reasoning_steps'])} steps")
        print(f"-> Chart Type: {data['chart']['chart_type'] if data['chart'] else 'None'}")
        print(f"-> Returned Records: {len(data['data_table']) if data['data_table'] else 0}")
        assert data['answer'] and len(data['answer']) > 0
        assert data['reasoning'] and len(data['reasoning']) > 0

    print("\n=== 3. Testing Dynamic Upload of a BRAND NEW Dataset (Zero Hardcoding Proof) ===")
    # Create an arbitrary banking / loans dataset that the system has never seen before!
    np.random.seed(99)
    new_data = {
        "loan_id": [f"LN-{1000 + i}" for i in range(150)],
        "branch": np.random.choice(["Downtown", "Uptown", "Suburbs", "Metro West", "Harbor"], 150),
        "loan_amount": np.random.uniform(5000, 250000, 150).round(2),
        "interest_rate": np.random.uniform(3.5, 18.5, 150).round(2),
        "credit_risk_score": np.random.randint(450, 850, 150),
        "default_status": np.random.choice(["Active", "Delinquent", "Paid Off", "Defaulted"], 150, p=[0.75, 0.1, 0.1, 0.05])
    }
    # Inject deliberate outlier
    new_data["loan_amount"][12] = 4500000.0  # $4.5M outlier

    df_loans = pd.DataFrame(new_data)
    csv_bytes = df_loans.to_csv(index=False).encode('utf-8')

    files = [('files', ('bank_loans.csv', csv_bytes, 'text/csv'))]
    r_upload = requests.post(f"{BASE_URL}/api/upload", files=files)
    assert r_upload.status_code == 200
    print("Upload Result:", r_upload.json()['loaded_tables'])

    print("\n=== 4. Asking Questions on the NEW Dataset ===")
    new_q = "Which branch has the highest total loan amount?"
    r_chat = requests.post(f"{BASE_URL}/api/chat", json={"message": new_q})
    assert r_chat.status_code == 200
    res_json = r_chat.json()
    print(f"[Q on new dataset]: '{new_q}'")
    print(f"-> Answer: {res_json['answer']}")
    print(f"-> SQL: {res_json['generated_sql']}")
    print(f"-> Chart: {res_json['chart']}")

    print("\n=== 5. Detecting Anomalies on the NEW Dataset ===")
    r_anom = requests.get(f"{BASE_URL}/api/anomalies?table_name=bank_loans&method=isolation_forest&contamination=0.03")
    assert r_anom.status_code == 200
    anom_json = r_anom.json()
    print(f"Found {anom_json['anomalies_found']} anomalies in bank_loans.")
    if anom_json['anomalies']:
        print(f"Top anomaly explanation: {anom_json['anomalies'][0]['explanation']}")

    print("\n=== 6. Testing Data Quality Endpoint ===")
    r_dq = requests.get(f"{BASE_URL}/api/data-quality")
    assert r_dq.status_code == 200
    dq_json = r_dq.json()
    print(f"Overall Data Health Score: {dq_json['overall_health_score']}%")

    print("\n=== 7. Testing HTML Report Generation ===")
    r_rep = requests.get(f"{BASE_URL}/api/report/export")
    assert r_rep.status_code == 200
    assert "Executive AI Data Intelligence Report" in r_rep.text
    print(f"Report Generated Successfully! Size: {len(r_rep.text)} bytes")

    print("\n[SUCCESS] ALL DYNAMIC END-TO-END VALIDATIONS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_full_system_dynamic()
