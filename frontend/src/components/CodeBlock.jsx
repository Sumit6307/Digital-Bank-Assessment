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
    <div className="code-block" style={{ margin: '10px 0' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 12px', background: '#181825',
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#A78BFA', fontWeight: '600', fontSize: '11px' }}>
          <Terminal size={13} />
          <span>{language.toUpperCase()}</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {onRun && (
            <button
              onClick={() => onRun(code, language)}
              className="btn btn-primary btn-sm"
              style={{ padding: '3px 8px', fontSize: '10px', height: '22px' }}
            >
              <Play size={10} />
              Run
            </button>
          )}
          <button
            onClick={handleCopy}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              padding: '3px 8px', fontSize: '10px', height: '22px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '4px', color: '#A1A1AA', cursor: 'pointer',
              fontFamily: 'inherit'
            }}
            title="Copy Code"
          >
            {copied ? <Check size={11} color="#10B981" /> : <Copy size={11} />}
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
                  userSelect: 'none', color: '#525266',
                  textAlign: 'right', paddingRight: '14px',
                  width: '28px', fontSize: '11px'
                }}>
                  {idx + 1}
                </td>
                <td style={{ color: '#CDD6F4', whiteSpace: 'pre', fontSize: '12.5px' }}>
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
