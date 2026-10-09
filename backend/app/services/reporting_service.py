import io
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.services.data_manager import data_manager
from app.services.dashboard_service import dashboard_service
from app.services.anomaly_detector import anomaly_detector

class ReportingService:
    def __init__(self):
        pass

    def generate_html_report(self, chat_history: Optional[List[Dict[str, Any]]] = None) -> str:
        overview = data_manager.get_dataset_overview()
        dashboard = dashboard_service.generate_dashboard()
        
        # Primary table anomalies
        anomalies_resp = None
        if overview.tables:
            primary_tbl = overview.tables[0].table_name
            anomalies_resp = anomaly_detector.detect_anomalies(primary_tbl, method="isolation_forest", contamination=0.03)

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Executive AI Data Intelligence Report</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            background-color: #f8fafc;
            margin: 0;
            padding: 40px;
            line-height: 1.6;
        }}
        .header {{
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            color: #ffffff;
            padding: 32px;
            border-radius: 16px;
            margin-bottom: 32px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }}
        .header h1 {{ margin: 0 0 8px 0; font-size: 28px; font-weight: 700; }}
        .header p {{ margin: 0; color: #94a3b8; font-size: 14px; }}
        .kpi-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
            margin-bottom: 32px;
        }}
        .kpi-card {{
            background: #ffffff;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }}
        .kpi-label {{ font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }}
        .kpi-value {{ font-size: 24px; font-weight: 700; color: #0f172a; margin: 6px 0; }}
        .kpi-desc {{ font-size: 12px; color: #94a3b8; }}
        .section {{
            background: #ffffff;
            padding: 28px;
            border-radius: 14px;
            border: 1px solid #e2e8f0;
            margin-bottom: 28px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }}
        .section h2 {{ font-size: 20px; margin-top: 0; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
            font-size: 14px;
        }}
        th, td {{
            padding: 10px 14px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }}
        th {{ background: #f8fafc; font-weight: 600; color: #475569; }}
        .badge {{
            display: inline-block;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
        }}
        .badge-success {{ background: #dcfce7; color: #15803d; }}
        .badge-warning {{ background: #fef9c3; color: #a16207; }}
        .badge-danger {{ background: #fee2e2; color: #b91c1c; }}
        .summary-box {{
            background: #f0fdf4;
            border-left: 4px solid #22c55e;
            padding: 16px;
            border-radius: 6px;
            margin: 16px 0;
            font-size: 15px;
            color: #166534;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Executive AI Data Intelligence Report</h1>
        <p>Generated automatically on {datetime.now().strftime("%B %d, %Y at %I:%M %p")} | Powered by Antigravity AI Analyst</p>
    </div>

    <div class="kpi-grid">
"""
        for kpi in dashboard.kpis:
            html += f"""
        <div class="kpi-card">
            <div class="kpi-label">{kpi.label}</div>
            <div class="kpi-value">{kpi.value}</div>
            <div class="kpi-desc">{kpi.description or ''}</div>
        </div>
"""
        html += f"""
    </div>

    <div class="section">
        <h2>💡 Executive Strategic Summary</h2>
        <div class="summary-box">
            {dashboard.executive_summary}
        </div>
        <h3>Strategic Recommendations</h3>
        <ul>
"""
        for act in dashboard.suggested_actions:
            html += f"<li>{act}</li>"

        html += f"""
        </ul>
    </div>

    <div class="section">
        <h2>🛡️ Data Quality & Schema Integrity</h2>
        <p>Overall Data Health Score: <span class="badge badge-success">{overview.data_quality.overall_health_score if overview.data_quality else 100}% Cleanliness</span></p>
        <table>
            <thead>
                <tr>
                    <th>Table Name</th>
                    <th>Row Count</th>
                    <th>Columns</th>
                    <th>Identified Keys</th>
                </tr>
            </thead>
            <tbody>
"""
        for tbl in overview.tables:
            html += f"""
                <tr>
                    <td><b>{tbl.table_name}</b></td>
                    <td>{tbl.row_count:,}</td>
                    <td>{tbl.column_count}</td>
                    <td>{", ".join(tbl.detected_keys) if tbl.detected_keys else 'N/A'}</td>
                </tr>
"""
        html += f"""
            </tbody>
        </table>
    </div>
"""

        if anomalies_resp and anomalies_resp.anomalies:
            html += f"""
    <div class="section">
        <h2>🚨 Detected High-Priority Anomalies</h2>
        <p>Found <b>{anomalies_resp.anomalies_found}</b> statistical anomalies in table <code>{anomalies_resp.table_name}</code>.</p>
        <table>
            <thead>
                <tr>
                    <th>Row #</th>
                    <th>Score</th>
                    <th>Flagged Dimensions</th>
                    <th>Root Cause Explanation</th>
                </tr>
            </thead>
            <tbody>
"""
            for a in anomalies_resp.anomalies[:10]:
                html += f"""
                <tr>
                    <td>#{a.row_index}</td>
                    <td><span class="badge badge-danger">{a.anomaly_score:.1f}</span></td>
                    <td>{", ".join(a.flagged_columns)}</td>
                    <td>{a.explanation}</td>
                </tr>
"""
            html += f"""
            </tbody>
        </table>
    </div>
"""

        html += """
</body>
</html>
"""
        return html

reporting_service = ReportingService()
