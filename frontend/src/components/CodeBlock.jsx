import React, { useState } from 'react';
import { Copy, Check, Terminal, Play } from 'lucide-react';

export default function CodeBlock({ code, language = 'sql', onRun = null }) {
  const [copied, setCopied] = useState(false);

  if (!code) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split('\n');

  return (
    <div style={{
      borderRadius: '10px',
      overflow: 'hidden',
      background: '#070a12',
      border: '1px solid rgba(255,255,255,0.08)',
      margin: '10px 0',
      fontSize: '12px',
      fontFamily: "'JetBrains Mono', monospace"
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 12px',
        background: 'rgba(255,255,255,0.03)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#818cf8', fontWeight: '600', fontSize: '11px' }}>
          <Terminal size={13} />
          <span>{language.toUpperCase()}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {onRun && (
            <button
              onClick={() => onRun(code, language)}
              className="btn-primary"
              style={{ padding: '3px 8px', fontSize: '10px', height: '22px' }}
            >
              <Play size={10} />
              Run
            </button>
          )}
          <button
            onClick={handleCopy}
            className="btn-secondary"
            style={{ padding: '3px 8px', fontSize: '10px', height: '22px' }}
            title="Copy Code"
          >
            {copied ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div style={{ padding: '12px', overflowX: 'auto', maxHeight: '240px' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx}>
                <td style={{
                  userSelect: 'none',
                  color: '#475569',
                  textAlign: 'right',
                  paddingRight: '12px',
                  width: '28px',
                  fontSize: '11px'
                }}>
                  {idx + 1}
                </td>
                <td style={{ color: '#e2e8f0', whiteSpace: 'pre' }}>
                  {line}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
