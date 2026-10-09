import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, LayoutDashboard, Database, 
  AlertOctagon, TrendingUp, Terminal, Sparkles
} from 'lucide-react';

import Navbar from './components/Navbar';
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

  const tabs = [
    { id: 'chat', label: 'AI Analyst', icon: <MessageSquare size={16} /> },
    { id: 'dashboard', label: 'Executive Dashboard', icon: <LayoutDashboard size={16} /> },
    { id: 'studio', label: 'Data Studio & Quality', icon: <Database size={16} /> },
    { id: 'anomalies', label: 'Anomaly Hunter', icon: <AlertOctagon size={16} /> },
    { id: 'forecasting', label: 'Forecasting Lab', icon: <TrendingUp size={16} /> },
    { id: 'playground', label: 'SQL & Python Studio', icon: <Terminal size={16} /> },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#07090e' }}>
      
      {/* Top Header Navbar */}
      <Navbar
        overview={overview}
        config={config}
        onOpenUpload={() => setShowUpload(true)}
        onLoadSamples={handleLoadSamples}
        onOpenSettings={() => setShowSettings(true)}
        onExportReport={() => setShowReport(true)}
        loading={loading}
      />

      {/* Navigation Sub-Tabs Bar */}
      <div style={{
        margin: '0 16px 16px 16px',
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        paddingBottom: '8px'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Active Tab View Body */}
      <main style={{ flex: 1 }}>
        {activeTab === 'chat' && (
          <ChatView
            overview={overview}
            onRunInPlayground={handleRunInPlayground}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            overview={overview}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'studio' && (
          <DataStudioView
            overview={overview}
          />
        )}

        {activeTab === 'anomalies' && (
          <AnomalyHunterView
            overview={overview}
          />
        )}

        {activeTab === 'forecasting' && (
          <ForecastingView
            overview={overview}
          />
        )}

        {activeTab === 'playground' && (
          <SQLPlaygroundView
            overview={overview}
            initialCode={playgroundQuery.code}
            initialLang={playgroundQuery.lang}
          />
        )}
      </main>

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
