import React, { useState } from 'react';
import { 
  Play, Terminal, Database, Download, Sparkles, 
  BarChart2, RefreshCw, CheckCircle2, AlertCircle, Copy, Check
} from 'lucide-react';
import DynamicChart from './DynamicChart';

export default function SQLPlaygroundView({ overview, initialCode = '', initialLang = 'sql' }) {
  const [lang, setLang] = useState(initialLang);
  const [code, setCode] = useState(
    initialCode ||
    (initialLang === 'sql'
      ? `SELECT region, \n       SUM(sales_amount) as total_revenue, \n       COUNT(*) as transaction_count\nFROM sales_transactions\nGROUP BY region\nORDER BY total_revenue DESC;`
      : `result_df = sales_transactions.groupby('region')['sales_amount'].sum().reset_index()`)
  );
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [stdout, setStdout] = useState('');
  const [duration, setDuration] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showChart, setShowChart] = useState(false);

  const handleExecute = async () => {
    if (!code.trim() || running) return;
    setRunning(true);
    setError(null);
    setResults(null);
    setStdout('');

    try {
      if (lang === 'sql') {
        const res = await fetch('/api/query/sql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: code, limit: 500 })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'SQL Query failed');
        setResults(data.records);
        setDuration(data.execution_time_seconds);
      } else {
        const res = await fetch('/api/query/python', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Python execution failed');
        setResults(data.records);
        setStdout(data.stdout || '');
        setDuration(data.execution_time_seconds);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCSV = () => {
    if (!results || results.length === 0) return;
    const keys = Object.keys(results[0]);
    const csvRows = [
      keys.join(','),
      ...results.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query_results.csv';
    a.click();
  };

  const columns = results && results.length > 0 ? Object.keys(results[0]) : [];

  return (
    <div style={{ padding: '0 16px 24px 16px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px' }}>
      
      {/* Sidebar: Schema Reference */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', height: 'calc(100vh - 120px)', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f8fafc', fontWeight: '700', fontSize: '13px' }}>
          <Database size={15} color="#6366f1" />
          <span>Database Tables</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {overview?.tables?.map((tbl) => (
            <div key={tbl.table_name} style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: '10px'
            }}>
              <div
                onClick={() => setCode(prev => `${prev}\nSELECT * FROM ${tbl.table_name} LIMIT 10;`)}
                style={{ fontSize: '12px', fontWeight: '700', color: '#818cf8', cursor: 'pointer', marginBottom: '6px' }}
                title="Click to insert SELECT"
              >
                {tbl.table_name}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {tbl.columns.map((c) => (
                  <div
                    key={c.name}
                    onClick={() => setCode(prev => `${prev} ${c.name}`)}
                    style={{ fontSize: '11px', color: '#94a3b8', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                    title="Click to insert column name"
                  >
                    <span>{c.name}</span>
                    <span style={{ color: '#64748b', fontSize: '9px' }}>{c.dtype}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Playground Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: 'calc(100vh - 120px)', overflowY: 'auto' }}>
        
        {/* Editor Box */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setLang('sql')}
                className={`btn-secondary ${lang === 'sql' ? 'badge-primary' : ''}`}
                style={{ padding: '4px 12px', fontSize: '12px' }}
              >
                DuckDB SQL
              </button>
              <button
                onClick={() => setLang('python')}
                className={`btn-secondary ${lang === 'python' ? 'badge-primary' : ''}`}
                style={{ padding: '4px 12px', fontSize: '12px' }}
              >
                Pandas Python
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleCopy} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={handleExecute} disabled={running} className="btn-primary" style={{ padding: '6px 16px' }}>
                {running ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} fill="#ffffff" />}
                <span>Execute ({lang.toUpperCase()})</span>
              </button>
            </div>
          </div>

          <textarea
            rows={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              lineHeight: 1.5,
              background: '#070a12',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '12px',
              color: '#f8fafc',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Execution Status & Output */}
        {error && (
          <div className="glass-card" style={{ padding: '14px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', marginBottom: '4px' }}>
              <AlertCircle size={15} />
              <span>Query Execution Error</span>
            </div>
            <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap' }}>{error}</pre>
          </div>
        )}

        {stdout && (
          <div className="glass-card" style={{ padding: '12px 16px', background: '#070a12' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', marginBottom: '4px' }}>STDOUT:</div>
            <pre style={{ margin: 0, fontSize: '12px', color: '#34d399', whiteSpace: 'pre-wrap' }}>{stdout}</pre>
          </div>
        )}

        {results && (
          <div className="glass-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>
                  Returned {results.length} Rows
                </span>
                {duration && (
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    • {duration}s execution time
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowChart(!showChart)}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                >
                  <BarChart2 size={13} color="#818cf8" />
                  {showChart ? 'Hide Chart' : 'Auto Chart'}
                </button>
                <button
                  onClick={downloadCSV}
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '12px' }}
                >
                  <Download size={13} />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Instant Dynamic Chart */}
            {showChart && columns.length >= 2 && (
              <DynamicChart
                config={{
                  chart_type: 'bar',
                  title: 'Playground Query Output Visualization',
                  x_axis: columns[0],
                  y_axis: columns[1],
                  data: results
                }}
                height={260}
              />
            )}

            {/* Results Table */}
            <div style={{ maxHeight: '320px', overflow: 'auto', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f172a' }}>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    {columns.map((col) => (
                      <th key={col} style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: '600' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 200).map((row, rIdx) => (
                    <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                      {columns.map((col) => (
                        <td key={col} style={{ padding: '7px 12px', color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                          {typeof row[col] === 'number' ? row[col].toLocaleString() : String(row[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
