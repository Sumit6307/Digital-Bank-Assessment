import React, { useState, useEffect } from 'react';
import { X, Cpu, ShieldCheck, Check, Globe } from 'lucide-react';
import { api } from '../services/api';

export default function SettingsModal({ isOpen, onClose, config, onSaveConfig }) {
  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [backendUrl, setBackendUrl] = useState('');
  const [selfHealing, setSelfHealing] = useState(true);
  const [savedStatus, setSavedStatus] = useState(false);

  useEffect(() => {
    if (config) {
      setProvider(config.provider || 'gemini');
      setModel(config.model || 'gemini-2.5-flash');
    }
    setBackendUrl(api.getBackendUrl() || '');
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    // Save backend URL locally
    api.setBackendUrl(backendUrl);

    const payload = {
      provider,
      model,
      enable_self_healing: selfHealing
    };
    if (geminiKey) payload.gemini_api_key = geminiKey;
    if (openaiKey) payload.openai_api_key = openaiKey;
    if (groqKey) payload.groq_api_key = groqKey;

    try {
      await onSaveConfig(payload);
    } catch (e) {
      console.warn("Could not push config to backend:", e);
    }
    setSavedStatus(true);
    setTimeout(() => {
      setSavedStatus(false);
      onClose();
      // Reload if backend URL changed to refresh state
      if (backendUrl !== api.getBackendUrl()) {
        window.location.reload();
      }
    }, 1000);
  };

  const getModelOptions = () => {
    if (provider === 'gemini') {
      return [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recommended)' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep Reasoning)' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
      ];
    } else if (provider === 'openai') {
      return [
        { id: 'gpt-4o', name: 'GPT-4o (High Precision)' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast)' },
        { id: 'o3-mini', name: 'o3-mini (Reasoning)' }
      ];
    } else if (provider === 'groq') {
      return [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Ultra Fast)' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' }
      ];
    }
    return [{ id: 'local-analytics', name: 'Local Analytics Engine (No Key Required)' }];
  };

  const formLabelStyle = {
    fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)',
    display: 'block', marginBottom: '6px'
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content animate-fade-up" style={{ width: '100%', maxWidth: '480px', padding: '28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: 'var(--radius-md)',
              background: 'var(--accent-light)', border: '1px solid var(--accent-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Cpu size={17} color="var(--accent)" />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>AI Settings</h2>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Configure LLM provider and model.</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Provider */}
          <div>
            <label style={formLabelStyle}>LLM Provider</label>
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                if (e.target.value === 'gemini') setModel('gemini-2.5-flash');
                else if (e.target.value === 'openai') setModel('gpt-4o');
                else if (e.target.value === 'groq') setModel('llama-3.3-70b-versatile');
                else setModel('local-analytics');
              }}
            >
              <option value="gemini">Google Gemini (Recommended)</option>
              <option value="openai">OpenAI (GPT-4o)</option>
              <option value="groq">Groq (Llama 3.3 70B)</option>
              <option value="local">Local Analytics (No Key)</option>
            </select>
          </div>

          {/* Model */}
          <div>
            <label style={formLabelStyle}>Model</label>
            <select value={model} onChange={(e) => setModel(e.target.value)} disabled={provider === 'local'}>
              {getModelOptions().map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </div>

          {/* API Keys */}
          {provider === 'gemini' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ ...formLabelStyle, marginBottom: 0 }}>Gemini API Key</label>
                {config?.has_gemini_key && (
                  <span style={{ fontSize: '11px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <ShieldCheck size={12} /> Active
                  </span>
                )}
              </div>
              <input
                type="password"
                placeholder={config?.has_gemini_key ? '••••••••••••••••' : 'Enter AIzaSy...'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
              />
            </div>
          )}

          {provider === 'openai' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ ...formLabelStyle, marginBottom: 0 }}>OpenAI API Key</label>
                {config?.has_openai_key && (
                  <span style={{ fontSize: '11px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <ShieldCheck size={12} /> Active
                  </span>
                )}
              </div>
              <input
                type="password"
                placeholder={config?.has_openai_key ? '••••••••••••••••' : 'Enter sk-proj-...'}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
              />
            </div>
          )}

          {provider === 'groq' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ ...formLabelStyle, marginBottom: 0 }}>Groq API Key</label>
                {config?.has_groq_key && (
                  <span style={{ fontSize: '11px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <ShieldCheck size={12} /> Active
                  </span>
                )}
              </div>
              <input
                type="password"
                placeholder={config?.has_groq_key ? '••••••••••••••••' : 'Enter gsk_...'}
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
              />
            </div>
          )}

          {/* Backend API URL (for Vercel / Render cloud deployments) */}
          <div style={{
            padding: '12px 14px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Globe size={14} color="var(--accent)" />
              <label style={{ ...formLabelStyle, marginBottom: 0 }}>Backend API URL</label>
            </div>
            <input
              type="text"
              placeholder="e.g. https://digital-ai-analyst-backend.onrender.com"
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              style={{ fontSize: '12px', padding: '8px 10px' }}
            />
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
              Leave empty for local dev (`/api`), or enter your live Render backend URL.
            </span>
          </div>

          {/* Self-Healing Toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)'
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Self-Healing Loop</div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Auto-corrects SQL errors via traceback analysis.</div>
            </div>
            <input
              type="checkbox" checked={selfHealing}
              onChange={(e) => setSelfHealing(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--accent)', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn btn-primary">
            {savedStatus ? (<><Check size={14} /> Saved!</>) : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
