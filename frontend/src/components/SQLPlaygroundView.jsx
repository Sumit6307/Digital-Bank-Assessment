import React, { useState } from 'react';
import { 
  Play, Database, Download, 
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
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '16px' }}>
      
      {/* Sidebar: Schema */}
      <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', height: 'calc(100vh - 128px)', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '13px', color: 'var(--text-primary)' }}>
          <Database size={15} color="var(--accent)" />
          <span>Tables</span>
        </div>

        {overview?.tables?.map((tbl) => (
          <div key={tbl.table_name} style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)', padding: '10px'
          }}>
            <div
              onClick={() => setCode(prev => `${prev}\nSELECT * FROM ${tbl.table_name} LIMIT 10;`)}
              style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent)', cursor: 'pointer', marginBottom: '6px' }}
              title="Click to insert SELECT"
            >
              {tbl.table_name}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {tbl.columns.map((c) => (
                <div
                  key={c.name}
                  onClick={() => setCode(prev => `${prev} ${c.name}`)}
                  style={{ fontSize: '11px', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}
                  title="Click to insert column"
                >
                  <span style={{ color: 'var(--text-secondary)' }}>{c.name}</span>
                  <span style={{ fontSize: '9px' }}>{c.dtype}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Main Editor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: 'calc(100vh - 128px)', overflowY: 'auto' }}>
        
        {/* Editor */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setLang('sql')}
                className={`btn ${lang === 'sql' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              >
                DuckDB SQL
              </button>
              <button
                onClick={() => setLang('python')}
                className={`btn ${lang === 'python' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              >
                Pandas Python
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={handleCopy} className="btn btn-secondary btn-sm">
                {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={handleExecute} disabled={running} className="btn btn-primary btn-sm">
                {running ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} />}
                Execute
              </button>
            </div>
          </div>

          <textarea
            rows={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              lineHeight: 1.5,
              background: '#1E1E2E',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              color: '#E2E8F0',
              resize: 'vertical',
              width: '100%'
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="card" style={{ padding: '14px', background: 'var(--danger-light)', borderColor: 'var(--danger-border)', color: 'var(--danger)', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', marginBottom: '4px' }}>
              <AlertCircle size={15} />
              <span>Execution Error</span>
            </div>
            <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>{error}</pre>
          </div>
        )}

        {/* Stdout */}
        {stdout && (
          <div className="code-block" style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: '600', marginBottom: '4px' }}>STDOUT:</div>
            <pre style={{ margin: 0, fontSize: '12px', color: '#34D399', whiteSpace: 'pre-wrap' }}>{stdout}</pre>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="card section-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color="var(--success)" />
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {results.length} Rows Returned
                </span>
                {duration && (
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    • {duration}s
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setShowChart(!showChart)} className="btn btn-secondary btn-sm">
                  <BarChart2 size={13} color="var(--accent)" />
                  {showChart ? 'Hide Chart' : 'Chart'}
                </button>
                <button onClick={downloadCSV} className="btn btn-secondary btn-sm">
                  <Download size={13} />
                  CSV
                </button>
              </div>
            </div>

            {showChart && columns.length >= 2 && (
              <DynamicChart
                config={{
                  chart_type: 'bar',
                  title: 'Query Visualization',
                  x_axis: columns[0],
                  y_axis: columns[1],
                  data: results
                }}
                height={260}
              />
            )}

            <div style={{ maxHeight: '320px', overflow: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 200).map((row, rIdx) => (
                    <tr key={rIdx}>
                      {columns.map((col) => (
                        <td key={col} style={{ whiteSpace: 'nowrap' }}>
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
