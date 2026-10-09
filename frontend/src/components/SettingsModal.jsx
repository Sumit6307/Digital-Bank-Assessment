import React, { useState, useEffect } from 'react';
import { X, Key, Cpu, ShieldCheck, Sparkles, Check, AlertCircle } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, config, onSaveConfig }) {
  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [selfHealing, setSelfHealing] = useState(true);
  const [savedStatus, setSavedStatus] = useState(false);

  useEffect(() => {
    if (config) {
      setProvider(config.provider || 'gemini');
      setModel(config.model || 'gemini-2.5-flash');
    }
  }, [config]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const payload = {
      provider,
      model,
      enable_self_healing: selfHealing
    };
    if (geminiKey) payload.gemini_api_key = geminiKey;
    if (openaiKey) payload.openai_api_key = openaiKey;
    if (groqKey) payload.groq_api_key = groqKey;

    await onSaveConfig(payload);
    setSavedStatus(true);
    setTimeout(() => {
      setSavedStatus(false);
      onClose();
    }, 1200);
  };

  const getModelOptions = () => {
    if (provider === 'gemini') {
      return [
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recommended - Ultra Fast)' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep Analytical Reasoning)' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
      ];
    } else if (provider === 'openai') {
      return [
        { id: 'gpt-4o', name: 'GPT-4o (High Precision)' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Cost Effective)' },
        { id: 'o3-mini', name: 'o3-mini (Advanced Reasoning)' }
      ];
    } else if (provider === 'groq') {
      return [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Ultra Low Latency)' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' }
      ];
    }
    return [{ id: 'local-analytics', name: 'Built-in Local Analytical Agent (Zero Key Required)' }];
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '520px',
        padding: '26px',
        background: '#0d1322',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Cpu size={18} color="#818cf8" />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff' }}>
                AI Model & LLM Settings
              </h2>
              <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                Configure multi-provider LLMs or switch to zero-key local analytical engine.
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Provider Selector */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              LLM Provider
            </label>
            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                if (e.target.value === 'gemini') setModel('gemini-2.5-flash');
                else if (e.target.value === 'openai') setModel('gpt-4o');
                else if (e.target.value === 'groq') setModel('llama-3.3-70b-versatile');
                else setModel('local-analytics');
              }}
              style={{ width: '100%' }}
            >
              <option value="gemini">Google Gemini (Recommended)</option>
              <option value="openai">OpenAI (GPT-4o / GPT-4o-mini)</option>
              <option value="groq">Groq (Llama 3.3 70B)</option>
              <option value="local">Local Analytical Engine (No API Key Needed)</option>
            </select>
          </div>

          {/* Model Selector */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              Model Architecture
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{ width: '100%' }}
              disabled={provider === 'local'}
            >
              {getModelOptions().map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </div>

          {/* API Key Inputs */}
          {provider === 'gemini' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#cbd5e1' }}>
                  Gemini API Key
                </label>
                {config?.has_gemini_key && (
                  <span style={{ fontSize: '11px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={12} /> Active in Environment
                  </span>
                )}
              </div>
              <input
                type="password"
                placeholder={config?.has_gemini_key ? '••••••••••••••••••••••••' : 'Enter AIzaSy...'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {provider === 'openai' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#cbd5e1' }}>
                  OpenAI API Key
                </label>
                {config?.has_openai_key && (
                  <span style={{ fontSize: '11px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={12} /> Active in Environment
                  </span>
                )}
              </div>
              <input
                type="password"
                placeholder={config?.has_openai_key ? '••••••••••••••••••••••••' : 'Enter sk-proj-...'}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {provider === 'groq' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#cbd5e1' }}>
                  Groq API Key
                </label>
                {config?.has_groq_key && (
                  <span style={{ fontSize: '11px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={12} /> Active in Environment
                  </span>
                )}
              </div>
              <input
                type="password"
                placeholder={config?.has_groq_key ? '••••••••••••••••••••••••' : 'Enter gsk_...'}
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          )}

          {/* Self-Healing Switch */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>
                Agentic Self-Healing Loop
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Auto-corrects and repairs SQL syntax errors using traceback introspection.
              </div>
            </div>
            <input
              type="checkbox"
              checked={selfHealing}
              onChange={(e) => setSelfHealing(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#6366f1', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-primary">
            {savedStatus ? (
              <>
                <Check size={14} /> Saved!
              </>
            ) : (
              'Save Configuration'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
