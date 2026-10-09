const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = envUrl ? `${envUrl.replace(/\/+$/, '')}/api` : '/api';

export const api = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getConfig() {
    const res = await fetch(`${API_BASE}/config`);
    return res.json();
  },

  async updateConfig(config) {
    const res = await fetch(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
  },

  async uploadFiles(files) {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  async loadSampleDatasets() {
    const res = await fetch(`${API_BASE}/load-samples`, {
      method: 'POST',
    });
    return res.json();
  },

  async clearDatasets() {
    const res = await fetch(`${API_BASE}/datasets/clear`, {
      method: 'DELETE',
    });
    return res.json();
  },

  async getDatasets() {
    const res = await fetch(`${API_BASE}/datasets`);
    return res.json();
  },

  async getDataQuality(tableName = null) {
    const url = tableName ? `${API_BASE}/data-quality?table_name=${tableName}` : `${API_BASE}/data-quality`;
    const res = await fetch(url);
    return res.json();
  },

  async getDashboard(tableName = null) {
    const url = tableName ? `${API_BASE}/dashboard?table_name=${tableName}` : `${API_BASE}/dashboard`;
    const res = await fetch(url);
    return res.json();
  },

  async chat(payload) {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Chat request failed');
    }
    return res.json();
  },

  async executeSql(query, limit = 500) {
    const res = await fetch(`${API_BASE}/query/sql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'SQL Execution error');
    }
    return res.json();
  },

  async executePython(code) {
    const res = await fetch(`${API_BASE}/query/python`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Python Execution error');
    }
    return res.json();
  },

  async getAnomalies(tableName = null, method = 'isolation_forest', contamination = 0.03) {
    const params = new URLSearchParams();
    if (tableName) params.append('table_name', tableName);
    params.append('method', method);
    params.append('contamination', contamination);

    const res = await fetch(`${API_BASE}/anomalies?${params.toString()}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Anomaly detection failed');
    }
    return res.json();
  },

  async getForecast(payload) {
    const res = await fetch(`${API_BASE}/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Forecasting failed');
    }
    return res.json();
  },

  getReportExportUrl() {
    return `${API_BASE}/report/export`;
  }
};
