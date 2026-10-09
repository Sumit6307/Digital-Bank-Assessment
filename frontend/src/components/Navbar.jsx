import React from 'react';
import { 
  Sparkles, Database, FileText, Settings, Upload, 
  RefreshCw, CheckCircle2, ShieldAlert, Cpu
} from 'lucide-react';

export default function Navbar({ 
  overview, 
  config, 
  onOpenUpload, 
  onLoadSamples, 
  onOpenSettings, 
  onExportReport,
  loading 
}) {
  const tableCount = overview?.tables?.length || 0;
  const healthScore = overview?.data_quality?.overall_health_score ?? 100;

  return (
    <header className="glass-panel" style={{
      margin: '12px 16px',
      padding: '12px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: '12px',
      zIndex: 50
    }}>
      {/* Brand & Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
        }}>
          <Sparkles size={20} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '17px', fontWeight: '800', letterSpacing: '-0.3px', color: '#ffffff' }}>
              Antigravity AI Analyst
            </h1>
            <span className="badge badge-primary" style={{ fontSize: '9px', padding: '2px 7px' }}>
              Enterprise v2.0
            </span>
          </div>
          <p style={{ fontSize: '11px', color: '#94a3b8' }}>
            Vectorized DuckDB & Multi-LLM Data Intelligence Engine
          </p>
        </div>
      </div>

      {/* Dataset & Health Indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '5px 12px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '9999px',
          fontSize: '12px'
        }}>
          <Database size={14} color="#6366f1" />
          <span style={{ color: '#cbd5e1', fontWeight: '600' }}>
            {tableCount} {tableCount === 1 ? 'Dataset' : 'Datasets'} Loaded
          </span>
          <span style={{ color: '#64748b' }}>•</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {healthScore >= 90 ? (
              <CheckCircle2 size={13} color="#10b981" />
            ) : (
              <ShieldAlert size={13} color="#f59e0b" />
            )}
            <span style={{ color: healthScore >= 90 ? '#34d399' : '#fbbf24', fontWeight: '600' }}>
              {healthScore}% Health
            </span>
          </div>
        </div>

        {/* Model Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '9999px',
          fontSize: '11px',
          color: '#a5b4fc',
          fontWeight: '600'
        }}>
          <Cpu size={13} />
          <span>{config?.model || 'Gemini 2.5 Flash'}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onOpenUpload}
          className="btn-secondary"
          title="Upload one or more CSV files"
        >
          <Upload size={14} />
          Upload Data
        </button>

        <button
          onClick={onLoadSamples}
          disabled={loading}
          className="btn-secondary"
          title="Load Multi-Table Sample Datasets (Sales, Customers, Products)"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Sample Data
        </button>

        <button
          onClick={onExportReport}
          className="btn-secondary"
          title="Export Executive Intelligence Audit Report (HTML/PDF)"
        >
          <FileText size={14} color="#06b6d4" />
          Export Report
        </button>

        <button
          onClick={onOpenSettings}
          className="btn-secondary"
          title="Model & API Key Settings"
        >
          <Settings size={14} />
        </button>
      </div>
    </header>
  );
}
