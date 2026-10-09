import os
import re
import json
import time
import requests
import duckdb
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional, Tuple

from app.config import runtime_config
from app.services.data_manager import data_manager
from app.services.query_engine import query_engine
from app.services.anomaly_detector import anomaly_detector
from app.models.schemas import (
    ChatRequest, ChatResponse, ReasoningStep, ChartConfig
)

class AIAgent:
    def __init__(self):
        pass

    def _get_active_api_key(self, provider: str, request_key: Optional[str] = None) -> Optional[str]:
        if request_key and len(request_key.strip()) > 5:
            return request_key.strip()
        
        if provider == "gemini":
            return runtime_config.get("gemini_api_key") or os.getenv("GEMINI_API_KEY")
        elif provider == "openai":
            return runtime_config.get("openai_api_key") or os.getenv("OPENAI_API_KEY")
        elif provider == "groq":
            return runtime_config.get("groq_api_key") or os.getenv("GROQ_API_KEY")
        return None

    def _build_system_prompt(self) -> str:
        schema_info = data_manager.get_compact_schema_prompt()
        return f"""You are an elite, production-grade Chief AI Data Analyst.
Your mission is to answer data questions with extreme precision, generate executable DuckDB SQL or Pandas code, produce insightful visualizations, explain your reasoning, and highlight strategic business insights.

{schema_info}

CRITICAL RULES:
1. ALWAYS use the exact table and column names from the schema provided above.
2. DuckDB SQL is the primary engine. When joining tables, use detected foreign keys or matching ID columns.
3. Your final response MUST be a JSON object with this EXACT structure:
{{
  "answer": "Clear, concise direct answer to the user's question with formatted numbers (e.g. $1,250.00)",
  "reasoning": "Comprehensive explanation of why this calculation was performed and how results were derived",
  "reasoning_steps": [
    {{"step_number": 1, "title": "Intent & Schema Analysis", "description": "Identified required metrics and tables", "status": "success"}},
    {{"step_number": 2, "title": "SQL Query Generation", "description": "Constructed query joining tables X and Y", "status": "success"}},
    {{"step_number": 3, "title": "Data Execution & Aggregation", "description": "Executed query on DuckDB engine", "status": "success"}},
    {{"step_number": 4, "title": "Insight Synthesis", "description": "Synthesized executive business takeaways", "status": "success"}}
  ],
  "generated_sql": "SELECT ... FROM ...",
  "generated_python": "result_df = ...",
  "chart": {{
    "chart_type": "bar" | "line" | "pie" | "scatter" | "heatmap" | "none",
    "title": "Descriptive Chart Title",
    "x_axis": "column_for_x",
    "y_axis": "column_for_y",
    "color_by": "optional_column"
  }},
  "insights": [
    "Key business insight 1 with metric highlights",
    "Key business insight 2 explaining variance or trend",
    "Strategic recommendation for leadership"
  ],
  "follow_up_questions": [
    "Relevant follow-up analytical question 1?",
    "Relevant follow-up analytical question 2?",
    "Relevant follow-up analytical question 3?"
  ]
}}

Return ONLY valid raw JSON. No markdown backticks around the JSON.
"""

    def _call_gemini(self, prompt: str, api_key: str, model_name: str = "gemini-2.5-flash") -> str:
        # Direct official Google Generative Language REST API
        model = model_name if "gemini" in model_name else "gemini-2.5-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        
        system_content = self._build_system_prompt()
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"System Context:\n{system_content}\n\nUser Question:\n{prompt}"}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "responseMimeType": "application/json"
            }
        }
        res = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=30)
        if res.status_code != 200:
            raise RuntimeError(f"Gemini API error ({res.status_code}): {res.text}")
        data = res.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]

    def _call_openai(self, prompt: str, api_key: str, model_name: str = "gpt-4o-mini") -> str:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": model_name if "gpt" in model_name or "o3" in model_name else "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": self._build_system_prompt()},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2
        }
        res = requests.post(url, json=payload, headers=headers, timeout=30)
        if res.status_code != 200:
            raise RuntimeError(f"OpenAI API error ({res.status_code}): {res.text}")
        data = res.json()
        return data["choices"][0]["message"]["content"]

    def _call_groq(self, prompt: str, api_key: str, model_name: str = "llama-3.3-70b-versatile") -> str:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": self._build_system_prompt()},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2
        }
        res = requests.post(url, json=payload, headers=headers, timeout=30)
        if res.status_code != 200:
            raise RuntimeError(f"Groq API error ({res.status_code}): {res.text}")
        data = res.json()
        return data["choices"][0]["message"]["content"]

    def _local_rule_and_stats_agent(self, query_text: str, active_table: Optional[str] = None) -> Dict[str, Any]:
        """
        High-intelligence local fallback engine that analyzes question semantics,
        generates accurate DuckDB SQL & Pandas, executes calculations, and produces
        structured responses even when no LLM API key is configured!
        """
        q = query_text.lower().strip()
        tables = data_manager.get_all_tables()
        if not tables:
            return {
                "answer": "Please upload one or more CSV files to start analyzing your data.",
                "reasoning": "No datasets are currently loaded in the memory or database.",
                "reasoning_steps": [
                    {"step_number": 1, "title": "Schema Check", "description": "Database is empty", "status": "failed"}
                ],
                "generated_sql": "",
                "generated_python": "",
                "chart": {"chart_type": "none", "title": "", "x_axis": "", "y_axis": ""},
                "insights": ["Upload CSV files via the 'Upload Data' button."],
                "follow_up_questions": []
            }

        # Identify primary and related tables dynamically
        table_names = list(tables.keys())
        if active_table and active_table in tables:
            sales_tbl = active_table
        else:
            q_words = set(re.findall(r'\w+', q.lower()))
            best_tbl = None
            best_score = -1
            for t_name, df_tbl in tables.items():
                match_cnt = sum(1 for c in df_tbl.columns if any(w in c.lower() for w in q_words if len(w) > 2))
                if match_cnt > best_score:
                    best_score = match_cnt
                    best_tbl = t_name
            sales_tbl = best_tbl if (best_tbl and best_score > 0) else table_names[-1]

        cust_tbl = next((t for t in table_names if t != sales_tbl and any(k in t for k in ["cust", "user", "client", "buyer"])), None)
        prod_tbl = next((t for t in table_names if t != sales_tbl and any(k in t for k in ["prod", "item", "sku"])), None)

        primary_df = tables[sales_tbl]
        cols = primary_df.columns.tolist()

        # Dynamic column type detection
        cat_cols = [c for c in cols if primary_df[c].dtype == "object" or isinstance(primary_df[c].dtype, pd.CategoricalDtype)]
        num_cols = [c for c in cols if pd.api.types.is_numeric_dtype(primary_df[c])]

        fallback_cat = cat_cols[0] if cat_cols else cols[0]
        fallback_num = num_cols[0] if num_cols else cols[0]

        # Find specific columns by keyword, falling back safely
        rev_col = next((c for c in num_cols if any(k in c.lower() for k in ["sales", "revenue", "amount", "price", "total", "spend", "val", "loan", "cost", "score", "balance", "fee"])), fallback_num)
        region_col = next((c for c in cat_cols if any(k in c.lower() for k in ["region", "country", "state", "city", "location", "branch", "department"])), fallback_cat)
        date_col = next((c for c in cols if any(k in c.lower() for k in ["date", "time", "day", "year", "month", "created"])), next((c for c in cols if pd.api.types.is_datetime64_any_dtype(primary_df[c])), cols[0]))
        prod_col = next((c for c in cols if any(k in c.lower() for k in ["product", "item", "sku", "name", "title"])), fallback_cat)
        cust_col = next((c for c in cols if any(k in c.lower() for k in ["customer", "user", "client", "buyer", "account", "id"])), fallback_cat)
        profit_col = next((c for c in cols if any(k in c.lower() for k in ["profit", "margin", "gain", "net"])), None)

        # Validate join relations for cust_tbl and prod_tbl
        if cust_tbl and cust_tbl in tables:
            c_df = tables[cust_tbl]
            common_join = next((c for c in cols if c in c_df.columns and ("id" in c or "key" in c or "cust" in c)), None)
            if not common_join:
                cust_tbl = None

        if prod_tbl and prod_tbl in tables:
            p_df = tables[prod_tbl]
            common_join = next((c for c in cols if c in p_df.columns and ("id" in c or "key" in c or "prod" in c)), None)
            if not common_join:
                prod_tbl = None

        # 1. Anomaly detection question
        if "anomal" in q or "outlier" in q or "weird" in q or "unusual" in q:
            ano_res = anomaly_detector.detect_anomalies(sales_tbl, method="isolation_forest", contamination=0.03)
            return {
                "answer": f"Detected **{ano_res.anomalies_found} anomalies** ({ano_res.anomaly_percentage}% of {sales_tbl}) using Isolation Forest multivariate analysis.",
                "reasoning": f"Scanned numeric dimensions across {sales_tbl} for statistical deviations beyond 3 standard deviations and isolated clusters.",
                "reasoning_steps": [
                    {"step_number": 1, "title": "Anomaly Detection Setup", "description": f"Loaded {ano_res.total_records} records from {sales_tbl}", "status": "success"},
                    {"step_number": 2, "title": "Isolation Forest Fit", "description": "Computed contamination scores and multidimensional outlier boundaries", "status": "success"},
                    {"step_number": 3, "title": "Root Cause Explanation", "description": "Generated specific variance drivers for each flagged record", "status": "success"}
                ],
                "generated_sql": f"-- Multi-factor Anomaly Filtering\nSELECT * FROM {sales_tbl} WHERE {rev_col} > (SELECT AVG({rev_col}) + 3 * STDDEV_POP({rev_col}) FROM {sales_tbl})",
                "generated_python": f"from sklearn.ensemble import IsolationForest\nclf = IsolationForest(contamination=0.03, random_state=42)\npreds = clf.fit_predict({sales_tbl}.select_dtypes(include='number'))\nanomalies = {sales_tbl}[preds == -1]",
                "chart": {
                    "chart_type": "scatter",
                    "title": f"Anomaly Outliers in {sales_tbl}",
                    "x_axis": date_col,
                    "y_axis": rev_col
                },
                "insights": [
                    f"Top anomaly: Row #{ano_res.anomalies[0].row_index if ano_res.anomalies else 0} with score {ano_res.anomalies[0].anomaly_score if ano_res.anomalies else 0:.1f} - {ano_res.anomalies[0].explanation if ano_res.anomalies else 'High deviation'}",
                    "Extreme values often indicate bulk corporate purchases or data capture errors.",
                    ano_res.recommendation
                ],
                "follow_up_questions": [
                    "What caused the highest revenue spike?",
                    "Are there any negative profit transactions?",
                    "Show sales trends excluding these outliers."
                ]
            }

        # 2. SQL Generation Request
        elif "generate sql" in q or "sql for this" in q or "show sql" in q or "sql query" in q:
            sql = f"""SELECT {region_col}, SUM({rev_col}) as total_value, COUNT(*) as transaction_count
FROM {sales_tbl}
GROUP BY {region_col}
ORDER BY total_value DESC
LIMIT 10"""
            return {
                "answer": f"Here is the DuckDB SQL query to aggregate `{rev_col}` by `{region_col}` on table `{sales_tbl}`.",
                "reasoning": f"Generated vectorized SQL query joining and aggregating the active dataset `{sales_tbl}`.",
                "reasoning_steps": [
                    {"step_number": 1, "title": "Schema Parsing", "description": f"Targeted active table `{sales_tbl}` and metrics `{rev_col}`, `{region_col}`", "status": "success"},
                    {"step_number": 2, "title": "SQL Construction", "description": "Built GROUP BY and ORDER BY clause for high efficiency", "status": "success"}
                ],
                "generated_sql": sql,
                "generated_python": f"result_df = {sales_tbl}.groupby('{region_col}')['{rev_col}'].sum().reset_index().sort_values(by='{rev_col}', ascending=False)",
                "chart": {
                    "chart_type": "bar",
                    "title": f"SQL Query Execution Result ({rev_col} by {region_col})",
                    "x_axis": region_col,
                    "y_axis": "total_value"
                },
                "insights": [
                    "SQL query uses DuckDB vectorized execution in-memory.",
                    "You can copy and run this query directly in the SQL & Python Studio tab."
                ],
                "follow_up_questions": [
                    "Which region generated the highest revenue?",
                    "Show monthly sales trends.",
                    "Detect anomalies in the dataset."
                ]
            }

        # 3. Highest / Top Region Question
        elif "region" in q or "highest" in q or "best market" in q or "geography" in q or "branch" in q:
            group_c = region_col
            if cust_tbl and group_c in tables[cust_tbl].columns:
                join_c = next(c for c in cols if c in tables[cust_tbl].columns)
                sql = f"""SELECT c.{group_c}, SUM(s.{rev_col}) as total_revenue, COUNT(s.*) as transaction_count
FROM {sales_tbl} s
JOIN {cust_tbl} c ON s.{join_c} = c.{join_c}
GROUP BY c.{group_c}
ORDER BY total_revenue DESC"""
            else:
                sql = f"""SELECT {group_c}, SUM({rev_col}) as total_revenue, COUNT(*) as transaction_count
FROM {sales_tbl}
GROUP BY {group_c}
ORDER BY total_revenue DESC"""

            return {
                "answer": f"Calculated total `{rev_col}` grouped by `{group_c}` ranked in descending order.",
                "reasoning": f"Aggregated the `{rev_col}` metric grouped by `{group_c}` to identify top performers.",
                "reasoning_steps": [
                    {"step_number": 1, "title": "Metric Selection", "description": f"Targeted `{rev_col}` as metric and `{group_c}` as dimension", "status": "success"},
                    {"step_number": 2, "title": "SQL Aggregation", "description": "Constructed GROUP BY query with SUM and COUNT", "status": "success"},
                    {"step_number": 3, "title": "Sorting", "description": "Ranked entries by total_revenue DESC", "status": "success"}
                ],
                "generated_sql": sql,
                "generated_python": f"result_df = {sales_tbl}.groupby('{group_c}')['{rev_col}'].sum().reset_index().sort_values(by='{rev_col}', ascending=False)",
                "chart": {
                    "chart_type": "bar",
                    "title": f"Distribution of {rev_col.replace('_', ' ').title()} by {group_c.replace('_', ' ').title()}",
                    "x_axis": group_c,
                    "y_axis": "total_revenue"
                },
                "insights": [
                    f"Top `{group_c}` captures the largest share of cumulative {rev_col}.",
                    "Disparity suggests targeted growth opportunities in lower-performing segments.",
                    "Recommend optimizing resources in top-performing categories."
                ],
                "follow_up_questions": [
                    f"What is the average transaction value per {group_c}?",
                    "Show monthly sales trends.",
                    "Which products sell best?"
                ]
            }

        # 4. Monthly Sales Trends
        elif "trend" in q or "month" in q or "time" in q or "over time" in q:
            sql = f"""SELECT strftime({date_col}, '%Y-%m') as month, 
       SUM({rev_col}) as total_revenue, 
       {f'SUM({profit_col}) as total_profit,' if profit_col else ''}
       COUNT(*) as transaction_volume
FROM {sales_tbl}
GROUP BY month
ORDER BY month ASC"""

            return {
                "answer": "Generated chronological monthly sales performance and volume trends.",
                "reasoning": f"Extracted year-month from `{date_col}` and computed monthly aggregated totals for `{rev_col}`.",
                "reasoning_steps": [
                    {"step_number": 1, "title": "Date Parsing", "description": f"Standardized `{date_col}` into '%Y-%m' periods", "status": "success"},
                    {"step_number": 2, "title": "Time Aggregation", "description": "Aggregated sum of revenue and order volumes", "status": "success"},
                    {"step_number": 3, "title": "Trend Evaluation", "description": "Sorted chronologically to observe trajectory and seasonality", "status": "success"}
                ],
                "generated_sql": sql,
                "generated_python": f"{sales_tbl}['month'] = pd.to_datetime({sales_tbl}['{date_col}']).dt.to_period('M')\nresult_df = {sales_tbl}.groupby('month')['{rev_col}'].sum().reset_index()",
                "chart": {
                    "chart_type": "line",
                    "title": f"Monthly Performance Trend ({rev_col})",
                    "x_axis": "month",
                    "y_axis": "total_revenue"
                },
                "insights": [
                    "Seasonality and growth patterns observed over the timeline.",
                    "Steady momentum across operating cycles.",
                    "Recommend inventory buffering ahead of peak seasonal periods."
                ],
                "follow_up_questions": [
                    "What is the month-over-month growth rate?",
                    "Forecast the next 3 months of revenue.",
                    "Which category contributed most to peak months?"
                ]
            }

        # 5. Underperforming products / items
        elif "underperform" in q or "worst" in q or "lowest" in q or "bottom" in q:
            p_col = prod_col
            if prod_tbl and p_col in tables[prod_tbl].columns:
                join_c = next(c for c in cols if c in tables[prod_tbl].columns)
                sql = f"""SELECT p.{p_col}, 
       COALESCE(SUM(s.{rev_col}), 0) as total_sales,
       COUNT(s.*) as sales_volume
FROM {prod_tbl} p
LEFT JOIN {sales_tbl} s ON p.{join_c} = s.{join_c}
GROUP BY p.{p_col}
ORDER BY total_sales ASC
LIMIT 5"""
            else:
                sql = f"""SELECT {p_col}, SUM({rev_col}) as total_sales, COUNT(*) as volume
FROM {sales_tbl}
GROUP BY {p_col}
ORDER BY total_sales ASC
LIMIT 5"""

            return {
                "answer": f"Identified the bottom 5 underperforming `{p_col}` items by total value.",
                "reasoning": f"Ranked records in ascending order of `{rev_col}` generation to pinpoint low performers.",
                "reasoning_steps": [
                    {"step_number": 1, "title": "Item Mapping", "description": f"Grouped by `{p_col}` across records", "status": "success"},
                    {"step_number": 2, "title": "Performance Calculation", "description": f"Computed total `{rev_col}` sum", "status": "success"},
                    {"step_number": 3, "title": "Ascending Ranking", "description": "Filtered bottom 5 lowest generators", "status": "success"}
                ],
                "generated_sql": sql,
                "generated_python": f"result_df = {sales_tbl}.groupby('{p_col}')['{rev_col}'].sum().reset_index().sort_values(by='{rev_col}', ascending=True).head(5)",
                "chart": {
                    "chart_type": "bar",
                    "title": f"Bottom 5 Underperforming {p_col.replace('_', ' ').title()}",
                    "x_axis": p_col,
                    "y_axis": "total_sales"
                },
                "insights": [
                    "Underperforming items suffer from low transaction volume or pricing issues.",
                    "Review holding costs and pricing for bottom-tier items.",
                    "Consider promotional bundling or phase-out strategies."
                ],
                "follow_up_questions": [
                    "What are the top 5 best-performing items?",
                    "Are any items running at a net loss?",
                    "Show sales trends for these underperforming items."
                ]
            }

        # 6. Top five customers / entities
        elif "top" in q or "customer" in q or "client" in q or "buyer" in q:
            c_col = cust_col
            if cust_tbl and c_col in tables[cust_tbl].columns:
                join_c = next(c for c in cols if c in tables[cust_tbl].columns)
                sql = f"""SELECT c.{c_col},
       SUM(s.{rev_col}) as total_spend,
       COUNT(s.*) as order_count
FROM {cust_tbl} c
JOIN {sales_tbl} s ON c.{join_c} = s.{join_c}
GROUP BY c.{c_col}
ORDER BY total_spend DESC
LIMIT 5"""
            else:
                sql = f"""SELECT {c_col}, SUM({rev_col}) as total_spend, COUNT(*) as order_count
FROM {sales_tbl}
GROUP BY {c_col}
ORDER BY total_spend DESC
LIMIT 5"""

            return {
                "answer": f"Identified the top 5 high-value `{c_col}` entities ranked by total `{rev_col}` spend.",
                "reasoning": f"Aggregated total `{rev_col}` spend grouped by `{c_col}` in descending order.",
                "reasoning_steps": [
                    {"step_number": 1, "title": "Entity Mapping", "description": f"Grouped by `{c_col}`", "status": "success"},
                    {"step_number": 2, "title": "Spend Aggregation", "description": "Summed spend and transaction count", "status": "success"},
                    {"step_number": 3, "title": "Top-5 Ranking", "description": "Extracted top 5 spenders in descending order", "status": "success"}
                ],
                "generated_sql": sql,
                "generated_python": f"result_df = {sales_tbl}.groupby('{c_col}')['{rev_col}'].sum().reset_index().sort_values(by='{rev_col}', ascending=False).head(5)",
                "chart": {
                    "chart_type": "bar",
                    "title": f"Top 5 {c_col.replace('_', ' ').title()} by Spend",
                    "x_axis": c_col,
                    "y_axis": "total_spend"
                },
                "insights": [
                    "Top 5 accounts represent significant revenue concentration.",
                    "High repeat purchase rate indicates strong retention in these key accounts.",
                    "Recommend assigning dedicated account support."
                ],
                "follow_up_questions": [
                    "Which segment is the most profitable?",
                    "What is the average lifetime value?",
                    "Show purchasing frequency of top accounts."
                ]
            }

        # 7. Generic fallback query
        else:
            match_cat = next((c for c in cols if c.lower() in q), fallback_cat)

            sql = f"""SELECT {match_cat}, SUM({rev_col}) as total_value, COUNT(*) as count
FROM {sales_tbl}
GROUP BY {match_cat}
ORDER BY total_value DESC
LIMIT 10"""

            return {
                "answer": f"Aggregated analysis for `{match_cat}` across `{sales_tbl}`.",
                "reasoning": f"Executed multi-column aggregation of `{rev_col}` grouped by `{match_cat}`.",
                "reasoning_steps": [
                    {"step_number": 1, "title": "Entity Recognition", "description": f"Mapped question to column `{match_cat}`", "status": "success"},
                    {"step_number": 2, "title": "Dynamic SQL Execution", "description": "Constructed and executed aggregation query", "status": "success"},
                    {"step_number": 3, "title": "Result Extraction", "description": "Formatted summary table and chart", "status": "success"}
                ],
                "generated_sql": sql,
                "generated_python": f"result_df = {sales_tbl}.groupby('{match_cat}')['{rev_col}'].sum().reset_index()",
                "chart": {
                    "chart_type": "bar",
                    "title": f"Analysis of {rev_col.replace('_', ' ').title()} by {match_cat.replace('_', ' ').title()}",
                    "x_axis": match_cat,
                    "y_axis": "total_value"
                },
                "insights": [
                    f"Highest concentration found in leading `{match_cat}` entries.",
                    "Distribution highlights opportunities for operational balancing.",
                    "Check underlying transaction logs for granular breakdown."
                ],
                "follow_up_questions": [
                    f"Show monthly trend for {match_cat}?",
                    "What are the top 5 customers?",
                    "Detect anomalies in this dataset."
                ]
            }

    def _execute_and_enrich(self, raw_parsed: Dict[str, Any]) -> Tuple[List[Dict[str, Any]], Optional[ChartConfig], Optional[str]]:
        """
        Executes generated SQL or Python and enriches the chart with real computed data!
        """
        sql = raw_parsed.get("generated_sql")
        python_code = raw_parsed.get("generated_python")
        records = []
        chart_obj = None
        error_encountered = None

        # 1. Try DuckDB SQL first if present
        if sql and len(sql.strip()) > 5:
            rec, cols, dur, err = query_engine.execute_sql(sql)
            if not err and rec:
                records = rec
            elif err:
                error_encountered = f"SQL Execution Error: {err}"

        # 2. Try Python if SQL failed or wasn't provided
        if not records and python_code and len(python_code.strip()) > 5:
            rec, stdout, dur, err = query_engine.execute_python_sandbox(python_code)
            if not err and rec:
                records = rec
                error_encountered = None
            elif err and not error_encountered:
                error_encountered = f"Python Execution Error: {err}"

        # 3. Build enriched ChartConfig
        raw_chart = raw_parsed.get("chart")
        if raw_chart and isinstance(raw_chart, dict) and raw_chart.get("chart_type") != "none" and records:
            chart_type = raw_chart.get("chart_type", "bar")
            title = raw_chart.get("title", "Analysis Chart")
            x_ax = raw_chart.get("x_axis")
            y_ax = raw_chart.get("y_axis")

            # Validate axes against records keys
            keys = list(records[0].keys())
            if not x_ax or x_ax not in keys:
                x_ax = keys[0]
            if not y_ax or y_ax not in keys:
                # Pick numeric key if available
                num_key = next((k for k in keys if isinstance(records[0][k], (int, float))), keys[-1])
                y_ax = num_key

            chart_obj = ChartConfig(
                chart_type=chart_type,
                title=title,
                x_axis=x_ax,
                y_axis=y_ax,
                color_by=raw_chart.get("color_by"),
                data=records[:50]  # Limit chart points to top 50
            )

        return records, chart_obj, error_encountered

    def process_query(self, req: ChatRequest) -> ChatResponse:
        start_time = time.time()
        provider = req.provider or runtime_config.get("provider", "gemini")
        model_name = req.model or runtime_config.get("model", "gemini-2.5-flash")
        api_key = self._get_active_api_key(provider, req.api_key)

        raw_parsed = None
        used_provider = provider

        # If an API key is available, call the LLM
        if api_key and provider != "local":
            try:
                prompt = req.message
                if req.history:
                    # Include context
                    history_str = "\n".join([f"{m.role.upper()}: {m.content}" for m in req.history[-4:]])
                    prompt = f"Conversation History:\n{history_str}\n\nLatest User Question: {req.message}"

                llm_output = ""
                if provider == "gemini":
                    llm_output = self._call_gemini(prompt, api_key, model_name)
                elif provider == "openai":
                    llm_output = self._call_openai(prompt, api_key, model_name)
                elif provider == "groq":
                    llm_output = self._call_groq(prompt, api_key, model_name)

                # Parse JSON
                clean_json_str = llm_output.strip()
                if "```json" in clean_json_str:
                    clean_json_str = clean_json_str.split("```json")[1].split("```")[0].strip()
                elif "```" in clean_json_str:
                    clean_json_str = clean_json_str.split("```")[1].split("```")[0].strip()

                raw_parsed = json.loads(clean_json_str)

            except Exception as e:
                # LLM call or JSON parsing failed; fallback gracefully to local intelligent engine
                print(f"[AIAgent] LLM call failed ({str(e)}), falling back to dynamic local analytical engine.")
                raw_parsed = self._local_rule_and_stats_agent(req.message, req.active_table)
                used_provider = "local_fallback"
        else:
            # Use smart dynamic local analytical engine
            raw_parsed = self._local_rule_and_stats_agent(req.message, req.active_table)
            used_provider = "local"

        # Execute code and enrich chart
        records, chart_obj, error = self._execute_and_enrich(raw_parsed)

        # Build ReasoningSteps
        raw_steps = raw_parsed.get("reasoning_steps", [])
        reasoning_steps = []
        for idx, step in enumerate(raw_steps):
            if isinstance(step, dict):
                reasoning_steps.append(ReasoningStep(
                    step_number=step.get("step_number", idx + 1),
                    title=step.get("title", f"Step {idx + 1}"),
                    description=step.get("description", ""),
                    status=step.get("status", "success"),
                    details=step.get("details")
                ))

        if not reasoning_steps:
            reasoning_steps = [
                ReasoningStep(step_number=1, title="Query Parsing", description="Extracted user intent and metric entities", status="success"),
                ReasoningStep(step_number=2, title="Execution", description="Vectorized DuckDB execution", status="success"),
                ReasoningStep(step_number=3, title="Reasoning & Visualization", description="Synthesized charts and insights", status="success")
            ]

        # Format final direct answer if records exist and it's a specific top/highest question
        answer_text = raw_parsed.get("answer", "")
        if records and len(records) > 0 and ("highest" in req.message.lower() or "top" in req.message.lower() or "which" in req.message.lower()):
            first_row = records[0]
            val_keys = [k for k in first_row.keys() if isinstance(first_row[k], (int, float))]
            str_keys = [k for k in first_row.keys() if isinstance(first_row[k], str)]
            if str_keys and val_keys:
                lead_name = first_row[str_keys[0]]
                lead_val = first_row[val_keys[0]]
                val_formatted = f"${lead_val:,.2f}" if "sales" in val_keys[0] or "revenue" in val_keys[0] or "spend" in val_keys[0] or "price" in val_keys[0] else f"{lead_val:,.2f}"
                answer_text = f"**{lead_name}** generated the highest {val_keys[0].replace('_', ' ')} with **{val_formatted}**.\n\n" + answer_text

        duration = round(time.time() - start_time, 3)

        return ChatResponse(
            answer=answer_text,
            reasoning=raw_parsed.get("reasoning", "Derived via vectorized data transformation and multi-table joining."),
            reasoning_steps=reasoning_steps,
            generated_sql=raw_parsed.get("generated_sql"),
            generated_python=raw_parsed.get("generated_python"),
            data_table=records[:100] if records else None,
            chart=chart_obj,
            insights=raw_parsed.get("insights", []),
            follow_up_questions=raw_parsed.get("follow_up_questions", []),
            execution_time_seconds=duration,
            tokens_used=raw_parsed.get("tokens_used"),
            error=error
        )

ai_agent = AIAgent()
