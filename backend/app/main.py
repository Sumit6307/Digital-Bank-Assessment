import os
import json
import pandas as pd
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse

from app.config import settings, runtime_config
from app.models.schemas import (
    ChatRequest, ChatResponse, SqlExecutionRequest, 
    PythonExecutionRequest, AnomalyDetectionResponse,
    ForecastRequest, ForecastResponse, DashboardResponse,
    DatasetOverview, ConfigUpdateRequest
)
from app.services.data_manager import data_manager
from app.services.query_engine import query_engine
from app.services.anomaly_detector import anomaly_detector
from app.services.forecasting_engine import forecasting_engine
from app.services.dashboard_service import dashboard_service
from app.services.llm_agent import ai_agent
from app.services.reporting_service import reporting_service

app = FastAPI(
    title="AI-Powered Enterprise Data Analyst API",
    description="Vectorized DuckDB & Python analytical engine with multi-LLM reasoning and anomaly detection",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event: auto-load sample datasets if available
@app.on_event("startup")
async def startup_event():
    sample_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "sample_data")
    if os.path.exists(sample_dir):
        for fname in os.listdir(sample_dir):
            if fname.endswith(".csv"):
                fpath = os.path.join(sample_dir, fname)
                try:
                    df = pd.read_csv(fpath)
                    data_manager.load_dataframe(fname, df)
                    print(f"Loaded sample dataset: {fname} ({len(df)} rows)")
                except Exception as e:
                    print(f"Error loading {fname}: {e}")

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "loaded_tables": list(data_manager.get_all_tables().keys()),
        "active_provider": runtime_config["provider"],
        "active_model": runtime_config["model"]
    }

@app.get("/api/config")
async def get_config():
    return {
        "provider": runtime_config["provider"],
        "model": runtime_config["model"],
        "has_gemini_key": bool(runtime_config["gemini_api_key"]),
        "has_openai_key": bool(runtime_config["openai_api_key"]),
        "has_groq_key": bool(runtime_config["groq_api_key"]),
        "enable_self_healing": runtime_config["enable_self_healing"]
    }

@app.post("/api/config")
async def update_config(conf: ConfigUpdateRequest):
    if conf.provider is not None:
        runtime_config["provider"] = conf.provider
    if conf.model is not None:
        runtime_config["model"] = conf.model
    if conf.gemini_api_key is not None:
        runtime_config["gemini_api_key"] = conf.gemini_api_key
    if conf.openai_api_key is not None:
        runtime_config["openai_api_key"] = conf.openai_api_key
    if conf.groq_api_key is not None:
        runtime_config["groq_api_key"] = conf.groq_api_key
    if conf.custom_endpoint is not None:
        runtime_config["custom_endpoint"] = conf.custom_endpoint

    return {"message": "Configuration updated successfully", "config": runtime_config}

@app.post("/api/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    loaded = []
    errors = []
    for file in files:
        if not file.filename.lower().endswith((".csv", ".txt", ".tsv")):
            errors.append(f"File '{file.filename}' is not a supported CSV format.")
            continue
        try:
            content = await file.read()
            tbl_name = data_manager.load_csv_bytes(file.filename, content)
            loaded.append(tbl_name)
        except Exception as e:
            errors.append(f"Failed to load '{file.filename}': {str(e)}")

    overview = data_manager.get_dataset_overview()
    return {
        "loaded_tables": loaded,
        "errors": errors,
        "overview": overview
    }

@app.post("/api/load-samples")
async def load_sample_datasets():
    sample_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "sample_data")
    if not os.path.exists(sample_dir):
        # Generate samples if missing
        from generate_samples import generate_sample_datasets
        generate_sample_datasets(sample_dir)

    loaded = []
    for fname in os.listdir(sample_dir):
        if fname.endswith(".csv"):
            fpath = os.path.join(sample_dir, fname)
            df = pd.read_csv(fpath)
            tbl = data_manager.sanitize_table_name(fname)
            data_manager.load_dataframe(tbl, df)
            loaded.append(tbl)

    overview = data_manager.get_dataset_overview()
    return {
        "message": f"Successfully loaded {len(loaded)} sample datasets.",
        "loaded_tables": loaded,
        "overview": overview
    }

@app.delete("/api/datasets/clear")
async def clear_datasets():
    data_manager.clear()
    return {"message": "All datasets have been cleared."}

@app.get("/api/datasets", response_model=DatasetOverview)
async def get_datasets():
    return data_manager.get_dataset_overview()

@app.get("/api/data-quality")
async def get_data_quality(table_name: Optional[str] = None):
    return data_manager.compute_data_quality(table_name)

@app.get("/api/dashboard", response_model=DashboardResponse)
async def get_dashboard(table_name: Optional[str] = None):
    return dashboard_service.generate_dashboard(table_name)

@app.post("/api/chat", response_model=ChatResponse)
async def chat_analyst(req: ChatRequest):
    return ai_agent.process_query(req)

@app.post("/api/query/sql")
async def execute_sql(req: SqlExecutionRequest):
    records, columns, duration, error = query_engine.execute_sql(req.query, limit=req.limit)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {
        "records": records,
        "columns": columns,
        "row_count": len(records),
        "execution_time_seconds": duration
    }

@app.post("/api/query/python")
async def execute_python(req: PythonExecutionRequest):
    records, stdout_output, duration, error = query_engine.execute_python_sandbox(req.code)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {
        "records": records,
        "stdout": stdout_output,
        "execution_time_seconds": duration
    }

@app.get("/api/anomalies", response_model=AnomalyDetectionResponse)
async def get_anomalies(table_name: Optional[str] = None, method: str = "isolation_forest", contamination: float = 0.03):
    tables = data_manager.get_all_tables()
    if not tables:
        raise HTTPException(status_code=400, detail="No datasets loaded.")
    tbl = table_name if table_name and table_name in tables else list(tables.keys())[0]
    return anomaly_detector.detect_anomalies(tbl, method=method, contamination=contamination)

@app.post("/api/forecast", response_model=ForecastResponse)
async def generate_forecast(req: ForecastRequest):
    try:
        return forecasting_engine.generate_forecast(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/report/export")
async def export_html_report():
    html_content = reporting_service.generate_html_report()
    return HTMLResponse(content=html_content, status_code=200)
