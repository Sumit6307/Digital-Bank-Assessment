import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, LayoutDashboard, Database, 
  AlertOctagon, TrendingUp, Terminal, Upload,
  RefreshCw, FileText, Settings, ChevronRight,
  CheckCircle2, ShieldAlert, Cpu, Sparkles
} from 'lucide-react';

import './App.css';
import ChatView from './components/ChatView';
import DashboardView from './components/DashboardView';
import DataStudioView from './components/DataStudioView';
import AnomalyHunterView from './components/AnomalyHunterView';
import ForecastingView from './components/ForecastingView';
import SQLPlaygroundView from './components/SQLPlaygroundView';
import FileUploadModal from './components/FileUploadModal';
import SettingsModal from './components/SettingsModal';
import ReportModal from './components/ReportModal';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [overview, setOverview] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [playgroundQuery, setPlaygroundQuery] = useState({ code: '', lang: 'sql' });

  // Modals
  const [showUpload, setShowUpload] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const refreshData = async () => {
    try {
      const [datasetsData, configData] = await Promise.all([
        api.getDatasets(),
        api.getConfig()
      ]);
      setOverview(datasetsData);
      setConfig(configData);
    } catch (e) {
      console.error('Failed to load initial data:', e);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleUploadFiles = async (files) => {
    setLoading(true);
    try {
      const res = await api.uploadFiles(files);
      setOverview(res.overview);
      return res;
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSamples = async () => {
    setLoading(true);
    try {
      const res = await api.loadSampleDatasets();
      setOverview(res.overview);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (newConfig) => {
    const res = await api.updateConfig(newConfig);
    setConfig(res.config);
  };

  const handleRunInPlayground = (code, lang) => {
    setPlaygroundQuery({ code, lang });
    setActiveTab('playground');
  };

  const tableCount = overview?.tables?.length || 0;
  const healthScore = overview?.data_quality?.overall_health_score ?? 100;

  const navSections = [
    {
      label: 'Analysis',
      items: [
        { id: 'chat', label: 'AI Analyst', icon: <MessageSquare size={17} /> },
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
        { id: 'studio', label: 'Data Studio', icon: <Database size={17} /> },
      ]
    },
    {
      label: 'Advanced',
      items: [
        { id: 'anomalies', label: 'Anomaly Hunter', icon: <AlertOctagon size={17} /> },
        { id: 'forecasting', label: 'Forecasting', icon: <TrendingUp size={17} /> },
        { id: 'playground', label: 'SQL & Python', icon: <Terminal size={17} /> },
      ]
    }
  ];

  return (
    <div className="app-layout">

      {/* ── Sidebar ── */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent) 0%, #7C3AED 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <div>
              <h1>Digital AI</h1>
              <p>Data Analyst</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div key={section.label}>
              <div className="sidebar-section-label">{section.label}</div>
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* Sidebar footer — quick actions */}
        <div style={{ padding: '12px', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button className="nav-item" onClick={() => setShowUpload(true)}>
            <Upload size={17} />
            <span>Upload Data</span>
          </button>
          <button className="nav-item" onClick={() => setShowSettings(true)}>
            <Settings size={17} />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="app-main">

        {/* Top Bar */}
        <header className="app-topbar">
          <div className="topbar-status">
            <div className="status-pill">
              <Database size={13} color="var(--accent)" />
              <span style={{ fontWeight: 600 }}>{tableCount} {tableCount === 1 ? 'Dataset' : 'Datasets'}</span>
            </div>
            <div className="status-pill">
              {healthScore >= 90 ? (
                <CheckCircle2 size={13} color="var(--success)" />
              ) : (
                <ShieldAlert size={13} color="var(--warning)" />
              )}
              <span style={{ fontWeight: 600, color: healthScore >= 90 ? 'var(--success)' : 'var(--warning)' }}>
                {healthScore}% Health
              </span>
            </div>
            <div className="status-pill">
              <Cpu size={13} color="var(--accent)" />
              <span>{config?.model || 'Gemini 2.5 Flash'}</span>
            </div>
          </div>

          <div className="topbar-actions">
            <button onClick={handleLoadSamples} disabled={loading} className="btn btn-secondary btn-sm">
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              Sample Data
            </button>
            <button onClick={() => setShowReport(true)} className="btn btn-secondary btn-sm">
              <FileText size={13} />
              Export Report
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="app-content">
          {activeTab === 'chat' && (
            <ChatView overview={overview} onRunInPlayground={handleRunInPlayground} />
          )}
          {activeTab === 'dashboard' && (
            <DashboardView overview={overview} onNavigateToTab={setActiveTab} />
          )}
          {activeTab === 'studio' && (
            <DataStudioView overview={overview} />
          )}
          {activeTab === 'anomalies' && (
            <AnomalyHunterView overview={overview} />
          )}
          {activeTab === 'forecasting' && (
            <ForecastingView overview={overview} />
          )}
          {activeTab === 'playground' && (
            <SQLPlaygroundView
              overview={overview}
              initialCode={playgroundQuery.code}
              initialLang={playgroundQuery.lang}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <FileUploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={handleUploadFiles}
        onLoadSamples={handleLoadSamples}
      />
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
      />
      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
      />
    </div>
  );
}
