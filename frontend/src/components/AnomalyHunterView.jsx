import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, ShieldAlert, RefreshCw, 
  CheckCircle2, Search
} from 'lucide-react';
import { api } from '../services/api';

export default function AnomalyHunterView({ overview }) {
  const [anomalyData, setAnomalyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState('');
  const [method, setMethod] = useState('isolation_forest');
  const [contamination, setContamination] = useState(0.03);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchAnomalies = async () => {
    if (!selectedTable && (!overview?.tables || overview.tables.length === 0)) return;
    setLoading(true);
    try {
      const tbl = selectedTable || overview.tables[0].table_name;
      const data = await api.getAnomalies(tbl, method, contamination);
      setAnomalyData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (overview?.tables?.length > 0) {
      const defTbl = selectedTable || overview.tables[0].table_name;
      setSelectedTable(defTbl);
    }
  }, [overview]);

  useEffect(() => {
    if (selectedTable) {
      fetchAnomalies();
    }
  }, [selectedTable, method, contamination]);

  const filteredAnomalies = anomalyData?.anomalies?.filter(item => {
    if (!searchTerm) return true;
    return (
      item.explanation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.flagged_columns?.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Controls */}
      <div className="card section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ marginBottom: '2px' }}>
              <AlertOctagon size={17} color="var(--danger)" />
              Anomaly Hunter
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Isolation Forest, IQR, and Z-Score outlier detection with explainability.
            </p>
          </div>
          <button onClick={fetchAnomalies} className="btn btn-secondary btn-sm">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Re-scan
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-light)'
        }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Target Dataset
            </label>
            <select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)} style={{ width: '100%' }}>
              {overview?.tables?.map((t) => (
                <option key={t.table_name} value={t.table_name}>{t.table_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Algorithm
            </label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ width: '100%' }}>
              <option value="isolation_forest">Isolation Forest (ML)</option>
              <option value="iqr">Interquartile Range (IQR)</option>
              <option value="z_score">Modified Z-Score (3σ)</option>
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Sensitivity
              </label>
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--danger)' }}>
                {(contamination * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range" min="0.01" max="0.10" step="0.01"
              value={contamination}
              onChange={(e) => setContamination(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--danger)' }}
            />
          </div>
        </div>
      </div>

      {/* Summary KPIs */}
      {anomalyData && (
        <div className="metric-grid">
          <div className="card metric-card animate-fade-up">
            <div className="metric-label">Records Scanned</div>
            <div className="metric-value">{anomalyData.total_records?.toLocaleString()}</div>
          </div>
          <div className="card metric-card animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <div className="metric-label" style={{ color: 'var(--danger)' }}>Anomalies Found</div>
            <div className="metric-value" style={{ color: 'var(--danger)' }}>
              {anomalyData.anomalies_found} ({anomalyData.anomaly_percentage}%)
            </div>
          </div>
          <div className="card metric-card animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="metric-label">Algorithm</div>
            <div className="metric-value" style={{ fontSize: '16px', color: 'var(--accent)' }}>
              {anomalyData.method_used}
            </div>
          </div>
        </div>
      )}

      {/* Recommendation */}
      {anomalyData?.recommendation && (
        <div className="card" style={{
          padding: '14px 18px',
          background: 'var(--danger-light)',
          borderColor: 'var(--danger-border)',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <ShieldAlert size={20} color="var(--danger)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.55 }}>
            <b>Takeaway:</b> {anomalyData.recommendation}
          </div>
        </div>
      )}

      {/* Anomaly Records */}
      <div className="card section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ marginBottom: 0 }}>
            Flagged Records ({filteredAnomalies.length})
          </h3>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)', padding: '4px 10px'
          }}>
            <Search size={14} color="var(--text-tertiary)" />
            <input
              type="text" placeholder="Search anomalies..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', padding: '4px', fontSize: '12px', width: '150px' }}
            />
          </div>
        </div>

        {filteredAnomalies.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredAnomalies.map((item, idx) => (
              <div key={idx} className="animate-fade-up" style={{
                padding: '14px 18px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                display: 'flex', flexDirection: 'column', gap: '8px',
                animationDelay: `${idx * 0.03}s`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge badge-danger">Row #{item.row_index}</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      Score: <b>{item.anomaly_score.toFixed(1)}/100</b>
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {item.flagged_columns?.map((c) => (
                      <span key={c} className="badge badge-warning" style={{ fontSize: '10px' }}>{c}</span>
                    ))}
                  </div>
                </div>

                <div style={{
                  fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.55,
                  background: 'var(--surface-primary)', padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)'
                }}>
                  <span style={{ color: 'var(--danger)', fontWeight: '700' }}>Why Flagged: </span>
                  {item.explanation}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  {Object.entries(item.record || {}).slice(0, 7).map(([k, v]) => (
                    <div key={k}>
                      <span style={{ color: 'var(--text-tertiary)' }}>{k}:</span> <b style={{ color: 'var(--text-secondary)' }}>{String(v ?? '')}</b>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <CheckCircle2 size={32} color="var(--success)" style={{ margin: '0 auto 8px auto' }} />
            <p>No anomalies found matching criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
