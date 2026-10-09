export function getApiBase() {
  const customUrl = localStorage.getItem('DIGITAL_BACKEND_URL');
  if (customUrl && customUrl.trim()) {
    return `${customUrl.trim().replace(/\/+$/, '')}/api`;
  }
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
  return envUrl ? `${envUrl.replace(/\/+$/, '')}/api` : '/api';
}

async function safeFetchJson(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${getApiBase()}${endpoint}`;
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      if (!res.ok) {
        throw new Error(`API returned HTTP ${res.status}: Backend not reachable at ${url}. If deployed on Vercel, ensure VITE_API_URL is set or configure Backend URL in Settings.`);
      }
      try {
        return JSON.parse(text);
      } catch {
        throw new Error(`Unexpected non-JSON response from ${url}. Is your backend running?`);
      }
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || data.message || `Request failed with status ${res.status}`);
    }
    return data;
  } catch (err) {
    if (err.message && err.message.includes('Failed to fetch')) {
      throw new Error(`Cannot connect to Backend API at ${url}. If using Render, the free tier may be waking up (wait 30s) or check your Backend URL in Settings.`);
    }
    throw err;
  }
}

export const api = {
  getBackendUrl() {
    return localStorage.getItem('DIGITAL_BACKEND_URL') || import.meta.env.VITE_API_URL || '';
  },

  setBackendUrl(url) {
    if (url && url.trim()) {
      localStorage.setItem('DIGITAL_BACKEND_URL', url.trim());
    } else {
      localStorage.removeItem('DIGITAL_BACKEND_URL');
    }
  },

  async getHealth() {
    return safeFetchJson('/health');
  },

  async getConfig() {
    return safeFetchJson('/config');
  },

  async updateConfig(config) {
    return safeFetchJson('/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
  },

  async uploadFiles(files) {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    return safeFetchJson('/upload', {
      method: 'POST',
      body: formData,
    });
  },

  async loadSampleDatasets() {
    return safeFetchJson('/load-samples', {
      method: 'POST',
    });
  },

  async clearDatasets() {
    return safeFetchJson('/datasets/clear', {
      method: 'DELETE',
    });
  },

  async getDatasets() {
    return safeFetchJson('/datasets');
  },

  async getDataQuality(tableName = null) {
    const endpoint = tableName ? `/data-quality?table_name=${tableName}` : '/data-quality';
    return safeFetchJson(endpoint);
  },

  async getDashboard(tableName = null) {
    const endpoint = tableName ? `/dashboard?table_name=${tableName}` : '/dashboard';
    return safeFetchJson(endpoint);
  },

  async chat(payload) {
    return safeFetchJson('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  async executeSql(query, limit = 500) {
    return safeFetchJson('/query/sql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit }),
    });
  },

  async executePython(code) {
    return safeFetchJson('/query/python', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
  },

  async getAnomalies(tableName = null, method = 'isolation_forest', contamination = 0.03) {
    const params = new URLSearchParams();
    if (tableName) params.append('table_name', tableName);
    params.append('method', method);
    params.append('contamination', contamination);
    return safeFetchJson(`/anomalies?${params.toString()}`);
  },

  async getForecast(payload) {
    return safeFetchJson('/forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  getReportExportUrl() {
    return `${getApiBase()}/report/export`;
  }
};
