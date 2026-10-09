# 🚀 Antigravity AI Data Analyst — Production-Ready Enterprise Application

An end-to-end, production-ready AI Data Analyst that enables users to upload single or multiple CSV files, profile datasets, generate instant executive dashboards, ask natural language analytical questions, visualize data with dynamic charts, detect statistical anomalies with root-cause explainers, and run time-series forecasts.

---

## 🌟 Key Highlights & Core Capabilities

- **Zero Hardcoding**: All calculations, SQL queries, Pandas sandboxing, anomaly scores, charts, and reasoning traces are dynamically generated and executed in real-time from whichever CSV files you upload.
- **Multi-LLM & Hybrid Fallback Engine**: Direct REST support for **Google Gemini 2.5 Flash / Pro**, **OpenAI GPT-4o / GPT-4o-mini**, **Groq (Llama 3.3 70B)**, plus a smart **Local Zero-Key Analytical Engine** so the app works out-of-the-box without requiring an API key.
- **Vectorized DuckDB & Python Sandbox**: Ultra-fast in-memory SQL execution (`SELECT ... FROM df1 JOIN df2`) with automated schema extraction, type inference, and self-healing query repair.
- **Root-Cause Anomaly Hunter**: Multivariate **Isolation Forest**, **IQR (1.5x)**, and **Modified Z-Score** algorithms with natural language explanations per flagged record (e.g. *"Sales amount is 41.9 standard deviations above the mean"*).
- **Time-Series Predictive Forecasting**: Horizon projections (7 to 90 days) with 95% confidence intervals, trend direction detection, and CAGR growth calculations.
- **Automated Executive Dashboard**: Instant KPIs (Revenue, Volume, Average Ticket, Margins), category breakdowns, monthly trends, correlation matrix, and strategic takeaways generated on dataset upload.
- **Enterprise Data Quality Profiler**: Automatic health scoring (0–100%), missing value rates, duplicate detection, zero-variance columns, and cross-table foreign key discovery.
- **Executive Audit Report Export**: Printable 1-click HTML / PDF reports with summary scorecards, anomaly audit logs, and actionable recommendations.

---

## 🏗️ Architecture & Technology Stack

```
Digital-Bank-Assessment/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI server with CORS, streaming, and REST endpoints
│   │   ├── config.py                # Environment configuration & runtime key overrides
│   │   ├── services/
│   │   │   ├── data_manager.py      # Multi-CSV loader, schema extractor, DuckDB registering
│   │   │   ├── query_engine.py      # DuckDB SQL & Sandboxed Python Pandas executor
│   │   │   ├── anomaly_detector.py  # Isolation Forest, IQR, Z-score & root-cause explainers
│   │   │   ├── forecasting_engine.py# Time-series trend & 95% confidence horizon forecaster
│   │   │   ├── dashboard_service.py # Dynamic KPI, chart, correlation & summary generator
│   │   │   ├── llm_agent.py         # Multi-provider LLM agent with self-healing loop
│   │   │   └── reporting_service.py # Professional HTML / PDF executive report generator
│   │   ├── models/
│   │   │   └── schemas.py           # Strict Pydantic models
│   │   └── sample_data/             # Realistic multi-table CSVs (Sales, Customers, Products)
│   ├── requirements.txt
│   ├── run_server.py
│   └── test_backend.py              # Pytest backend test suite
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # Main application orchestrator
│   │   ├── index.css                # Midnight Executive Cyberpunk design system
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Top glassmorphism header with status & model badges
│   │   │   ├── ChatView.jsx         # Conversational AI Analyst with reasoning steps & charts
│   │   │   ├── DashboardView.jsx    # Instant executive KPI dashboard
│   │   │   ├── DataStudioView.jsx   # Schema explorer, quality scorecard & data grid
│   │   │   ├── AnomalyHunterView.jsx# Deep dive outlier detection studio
│   │   │   ├── ForecastingView.jsx  # Predictive horizon modeling studio
│   │   │   ├── SQLPlaygroundView.jsx# Live SQL/Python code editor with instant charts
│   │   │   ├── DynamicChart.jsx     # Responsive Chart.js visualizer (Bar, Line, Pie, Scatter)
│   │   │   ├── FileUploadModal.jsx  # Multi-CSV drag-and-drop uploader
│   │   │   ├── SettingsModal.jsx    # Model & API key manager
│   │   │   └── ReportModal.jsx      # Audit report previewer
│   │   └── services/api.js          # REST client
│   └── package.json
├── verify_system.py                 # Live end-to-end system verification script
└── README.md
```

---

## ⚡ Quickstart & Setup

### 1. Backend Setup

```bash
# Navigate to backend and install dependencies
cd backend
pip install -r requirements.txt

# Start the backend server
python run_server.py
```
*Backend runs on `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.*

### 2. Frontend Setup

```bash
# Navigate to frontend and install dependencies
cd frontend
npm install

# Start the Vite development server
npm run dev
```
*Frontend runs on `http://localhost:5173/`.*

---

## 🧪 Testing & Validation

Run the automated backend test suite:
```bash
python -m pytest backend/test_backend.py -v -s
```

Run the end-to-end dynamic system verification (tests sample queries + brand new dataset upload):
```bash
python verify_system.py
```

---

## 💡 Example Natural Language Questions

1. *"Which region generated the highest revenue?"*
2. *"Show monthly sales trends."*
3. *"Which products are underperforming?"*
4. *"What are the top five customers?"*
5. *"Generate SQL for this analysis."*
6. *"Detect anomalies in the dataset."*
7. *"Which customer segment has the highest transaction frequency?"*
8. *"Forecast sales for the next 30 days."*

---

## 🛡️ License & Compliance
Built with clean, modular architecture and standard MIT/Apache licensing compliance.
