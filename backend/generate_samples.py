import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_sample_datasets(output_dir: str):
    os.makedirs(output_dir, exist_ok=True)
    random.seed(42)
    np.random.seed(42)

    # 1. Products Dataset
    categories = {
        "Electronics": ["Smartphone Pro", "UltraBook 15", "Wireless Earbuds", "4K Gaming Monitor", "Smartwatch Series 5"],
        "Furniture": ["Ergonomic Desk Chair", "Standing Desk 60in", "Bookshelf Modern", "Executive Recliner", "Conference Table"],
        "Office Supplies": ["Gel Pen Box (24pk)", "Heavy Duty Stapler", "Laser Copy Paper (500 sheets)", "Desk Organizer Set", "Noise-Cancelling Desk Partition"],
        "Clothing": ["Performance Polo", "Waterproof Shell Jacket", "Slim Fit Chinos", "Merino Wool Sweater", "Athletic Socks Pack"]
    }
    
    product_rows = []
    pid = 101
    for cat, items in categories.items():
        for item in items:
            cost = round(random.uniform(10.0, 450.0), 2)
            margin = random.uniform(1.25, 2.2)
            price = round(cost * margin, 2)
            stock = random.randint(15, 600)
            supplier = random.choice(["Apex Logistics", "Nexus Global", "Pacific Supply Co.", "Vanguard Mfg", "Horizon Direct"])
            product_rows.append({
                "product_id": f"PRD-{pid}",
                "product_name": item,
                "category": cat,
                "unit_cost": cost,
                "unit_price": price,
                "stock_quantity": stock,
                "supplier": supplier
            })
            pid += 1
    
    df_products = pd.DataFrame(product_rows)
    df_products.to_csv(os.path.join(output_dir, "products.csv"), index=False)
    print(f"Generated products.csv with {len(df_products)} rows.")

    # 2. Customers Dataset
    regions = {
        "North America": ["New York", "San Francisco", "Chicago", "Toronto", "Austin", "Seattle"],
        "Europe": ["London", "Berlin", "Paris", "Amsterdam", "Stockholm", "Madrid"],
        "Asia Pacific": ["Tokyo", "Singapore", "Sydney", "Seoul", "Mumbai"],
        "Latin America": ["Sao Paulo", "Mexico City", "Buenos Aires", "Bogota"]
    }
    segments = ["Enterprise", "Mid-Market", "Small Business", "Consumer"]
    first_names = ["James", "Emma", "Michael", "Sophia", "David", "Olivia", "Lucas", "Ava", "Alexander", "Isabella", "Daniel", "Mia", "Ethan", "Charlotte", "Oliver"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson", "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "Martin", "Lee"]

    customer_rows = []
    cid = 1001
    for i in range(120):
        c_name = f"{random.choice(first_names)} {random.choice(last_names)}"
        region = random.choice(list(regions.keys()))
        city = random.choice(regions[region])
        segment = random.choice(segments)
        signup_offset = random.randint(100, 900)
        signup_date = (datetime(2025, 12, 31) - timedelta(days=signup_offset)).strftime("%Y-%m-%d")
        credit_score = random.randint(580, 850)
        rating = round(random.uniform(3.2, 5.0), 1)

        customer_rows.append({
            "customer_id": f"CUST-{cid}",
            "customer_name": c_name,
            "segment": segment,
            "region": region,
            "city": city,
            "signup_date": signup_date,
            "credit_score": credit_score,
            "customer_satisfaction": rating
        })
        cid += 1

    df_customers = pd.DataFrame(customer_rows)
    df_customers.to_csv(os.path.join(output_dir, "customers.csv"), index=False)
    print(f"Generated customers.csv with {len(df_customers)} rows.")

    # 3. Sales Transactions Dataset
    start_date = datetime(2025, 1, 1)
    end_date = datetime(2025, 12, 31)
    total_days = (end_date - start_date).days

    transaction_rows = []
    tid = 50001

    for day_idx in range(total_days):
        current_date = start_date + timedelta(days=day_idx)
        # Add seasonal / weekly bump (higher on Fri/Sat, Q4 holiday bump)
        day_of_week = current_date.weekday()
        is_q4 = current_date.month in [10, 11, 12]
        num_txns = random.randint(3, 8) + (2 if is_q4 else 0) + (1 if day_of_week >= 4 else 0)

        for _ in range(num_txns):
            cust = random.choice(customer_rows)
            prod = random.choice(product_rows)
            qty = random.choices([1, 2, 3, 4, 5, 8, 10, 15], weights=[40, 25, 15, 8, 5, 4, 2, 1])[0]
            
            # Base price & discounts
            base_price = prod["unit_price"]
            cost = prod["unit_cost"]
            discount_pct = random.choices([0.0, 0.05, 0.1, 0.15, 0.25], weights=[50, 25, 15, 7, 3])[0]
            sales_amount = round(qty * base_price * (1.0 - discount_pct), 2)
            profit = round(sales_amount - (qty * cost), 2)
            
            shipping_cost = round(random.uniform(5.0, 45.0), 2)
            payment_method = random.choice(["Credit Card", "Wire Transfer", "ACH Direct", "PayPal", "Corporate Invoice"])

            transaction_rows.append({
                "transaction_id": f"TXN-{tid}",
                "date": current_date.strftime("%Y-%m-%d"),
                "customer_id": cust["customer_id"],
                "product_id": prod["product_id"],
                "region": cust["region"],
                "sales_amount": sales_amount,
                "quantity": qty,
                "discount": discount_pct,
                "profit": profit,
                "payment_method": payment_method,
                "shipping_cost": shipping_cost
            })
            tid += 1

    # Inject deliberate, interesting anomalies for detection
    # Anomaly 1: Massive transaction spike in profit/amount
    transaction_rows.append({
        "transaction_id": f"TXN-{tid}",
        "date": "2025-11-28",
        "customer_id": "CUST-1005",
        "product_id": "PRD-102",
        "region": "North America",
        "sales_amount": 94850.00,
        "quantity": 180,
        "discount": 0.45,
        "profit": 38400.00,
        "payment_method": "Corporate Invoice",
        "shipping_cost": 450.00
    })
    tid += 1

    # Anomaly 2: Extreme negative profit due to accidental 90% discount
    transaction_rows.append({
        "transaction_id": f"TXN-{tid}",
        "date": "2025-07-14",
        "customer_id": "CUST-1042",
        "product_id": "PRD-101",
        "region": "Europe",
        "sales_amount": 250.00,
        "quantity": 50,
        "discount": 0.92,
        "profit": -18400.00,
        "payment_method": "Credit Card",
        "shipping_cost": 85.00
    })
    tid += 1

    # Anomaly 3: Shipping cost outlier
    transaction_rows.append({
        "transaction_id": f"TXN-{tid}",
        "date": "2025-03-22",
        "customer_id": "CUST-1019",
        "product_id": "PRD-112",
        "region": "Asia Pacific",
        "sales_amount": 120.00,
        "quantity": 1,
        "discount": 0.0,
        "profit": 45.00,
        "payment_method": "Wire Transfer",
        "shipping_cost": 3200.00
    })

    df_txns = pd.DataFrame(transaction_rows)
    df_txns.to_csv(os.path.join(output_dir, "sales_transactions.csv"), index=False)
    print(f"Generated sales_transactions.csv with {len(df_txns)} rows.")

if __name__ == "__main__":
    output_directory = os.path.join(os.path.dirname(__file__), "sample_data")
    generate_sample_datasets(output_directory)
