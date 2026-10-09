from typing import List, Dict, Any, Optional, Union
from pydantic import BaseModel, Field

class ColumnProfile(BaseModel):
    name: str
    dtype: str
    non_null_count: int
    null_count: int
    null_percentage: float
    unique_count: int
    sample_values: List[Any]
    is_numeric: bool
    is_datetime: bool
    is_categorical: bool
    stats: Optional[Dict[str, Any]] = None

class TableSchema(BaseModel):
    table_name: str
    row_count: int
    column_count: int
    columns: List[ColumnProfile]
    preview_data: List[Dict[str, Any]]
    detected_keys: Optional[List[str]] = None

class DataQualityMetric(BaseModel):
    overall_health_score: float
    total_rows: int
    total_columns: int
    total_nulls: int
    null_cell_percentage: float
    duplicate_rows_count: int
    duplicate_percentage: float
    column_issues: List[Dict[str, Any]]
    recommendations: List[str]

class JoinRelationship(BaseModel):
    table_a: str
    column_a: str
    table_b: str
    column_b: str
    confidence: float
    match_cardinality: str

class DatasetOverview(BaseModel):
    tables: List[TableSchema]
    relationships: List[JoinRelationship]
    data_quality: Optional[DataQualityMetric] = None
    loaded_at: str

class ChartConfig(BaseModel):
    chart_type: str  # bar, line, pie, scatter, area, heatmap, box, histogram
    title: str
    x_axis: Optional[str] = None
    y_axis: Optional[Union[str, List[str]]] = None
    color_by: Optional[str] = None
    data: List[Dict[str, Any]]
    plotly_spec: Optional[Dict[str, Any]] = None

class ReasoningStep(BaseModel):
    step_number: int
    title: str
    description: str
    status: str  # pending, success, failed, skipped
    details: Optional[Any] = None

class ChatMessage(BaseModel):
    role: str  # user, assistant, system
    content: str
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    active_table: Optional[str] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    api_key: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    reasoning: str
    reasoning_steps: List[ReasoningStep]
    generated_sql: Optional[str] = None
    generated_python: Optional[str] = None
    data_table: Optional[List[Dict[str, Any]]] = None
    chart: Optional[ChartConfig] = None
    insights: List[str] = []
    follow_up_questions: List[str] = []
    execution_time_seconds: float
    tokens_used: Optional[int] = None
    error: Optional[str] = None

class SqlExecutionRequest(BaseModel):
    query: str
    limit: Optional[int] = 500

class PythonExecutionRequest(BaseModel):
    code: str

class AnomalyItem(BaseModel):
    row_index: int
    record: Dict[str, Any]
    anomaly_score: float
    flagged_columns: List[str]
    explanation: str

class AnomalyDetectionResponse(BaseModel):
    table_name: str
    method_used: str
    total_records: int
    anomalies_found: int
    anomaly_percentage: float
    anomalies: List[AnomalyItem]
    distribution_summary: Dict[str, Any]
    recommendation: str

class ForecastRequest(BaseModel):
    table_name: str
    date_column: str
    metric_column: str
    group_by: Optional[str] = None
    horizon_periods: int = 30
    frequency: str = "D"  # D, W, M, Y

class ForecastPoint(BaseModel):
    date: str
    actual: Optional[float] = None
    forecast: Optional[float] = None
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None

class ForecastResponse(BaseModel):
    metric_column: str
    date_column: str
    historical_count: int
    forecast_count: int
    trend_direction: str
    growth_rate_pct: float
    points: List[ForecastPoint]
    summary_insight: str

class DashboardKPI(BaseModel):
    label: str
    value: Union[str, float, int]
    change_pct: Optional[float] = None
    trend: Optional[str] = "neutral"
    icon: Optional[str] = None
    description: Optional[str] = None

class DashboardResponse(BaseModel):
    kpis: List[DashboardKPI]
    executive_summary: str
    charts: List[ChartConfig]
    top_performers: List[Dict[str, Any]]
    risk_factors: List[str]
    suggested_actions: List[str]

class ConfigUpdateRequest(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None
    gemini_api_key: Optional[str] = None
    openai_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    custom_endpoint: Optional[str] = None
