import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, ShieldAlert, Sparkles, RefreshCw, 
  Sliders, ArrowUpRight, CheckCircle2, Search
} from 'lucide-react';
import DynamicChart from './DynamicChart';

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
      const res = await fetch(`/api/anomalies?table_name=${tbl}&method=${method}&contamination=${contamination}`);
      const data = await res.json();
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
    <div style={{ padding: '0 16px 24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Controls Header */}
      <div className="glass-card" style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertOctagon size={18} color="#f43f5e" />
              Anomaly Hunter & Root-Cause Explainer
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              Multivariate Isolation Forest, IQR, and Z-Score outlier detection with automated explainability.
            </p>
          </div>

          <button onClick={fetchAnomalies} className="btn-secondary" style={{ fontSize: '12px' }}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Re-scan Dataset
          </button>
        </div>

        {/* Sliders and Method Picker */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.06)'
        }}>
          {/* Target Table */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              TARGET DATASET
            </label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              style={{ width: '100%' }}
            >
              {overview?.tables?.map((t) => (
                <option key={t.table_name} value={t.table_name}>{t.table_name}</option>
              ))}
            </select>
          </div>

          {/* Algorithm Selector */}
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              DETECTION ALGORITHM
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="isolation_forest">Isolation Forest (Multivariate ML)</option>
              <option value="iqr">Interquartile Range (IQR 1.5x)</option>
              <option value="z_score">Modified Z-Score (3.0 Std Dev)</option>
            </select>
          </div>

          {/* Contamination Slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8' }}>
                CONTAMINATION SENSITIVITY
              </label>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#f43f5e' }}>
                {(contamination * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.10"
              step="0.01"
              value={contamination}
              onChange={(e) => setContamination(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: '#f43f5e' }}
            />
          </div>
        </div>
      </div>

      {/* Summary KPI Badges */}
      {anomalyData && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px'
        }}>
          <div className="glass-card" style={{ padding: '16px 18px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Total Records Scanned</span>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>
              {anomalyData.total_records?.toLocaleString()}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '16px 18px' }}>
            <span style={{ fontSize: '11px', color: '#fb7185', fontWeight: '600', textTransform: 'uppercase' }}>Anomalies Flagged</span>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#f43f5e', marginTop: '4px' }}>
              {anomalyData.anomalies_found} ({anomalyData.anomaly_percentage}%)
            </div>
          </div>

          <div className="glass-card" style={{ padding: '16px 18px' }}>
            <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: '600', textTransform: 'uppercase' }}>Algorithm Applied</span>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#a5b4fc', marginTop: '4px' }}>
              {anomalyData.method_used}
            </div>
          </div>
        </div>
      )}

      {/* Recommendation Banner */}
      {anomalyData?.recommendation && (
        <div className="glass-card" style={{
          padding: '14px 18px',
          background: 'rgba(244, 63, 94, 0.08)',
          border: '1px solid rgba(244, 63, 94, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <ShieldAlert size={20} color="#f43f5e" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '13px', color: '#f8fafc', lineHeight: 1.5 }}>
            <b>Executive Takeaway:</b> {anomalyData.recommendation}
          </div>
        </div>
      )}

      {/* Anomaly Records Explanatory Table */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc' }}>
            Flagged Outlier Records & Explanations ({filteredAnomalies.length})
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#090e18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px 10px' }}>
            <Search size={14} color="#64748b" />
            <input
              type="text"
              placeholder="Search anomalies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', padding: '2px', fontSize: '12px' }}
            />
          </div>
        </div>

        {filteredAnomalies.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredAnomalies.map((item, idx) => (
              <div key={idx} style={{
                padding: '14px 18px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge badge-rose" style={{ fontSize: '11px' }}>
                      Row #{item.row_index}
                    </span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#e2e8f0' }}>
                      Anomaly Score: <b>{item.anomaly_score.toFixed(1)}/100</b>
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    {item.flagged_columns?.map((c) => (
                      <span key={c} className="badge badge-amber" style={{ fontSize: '10px' }}>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5, background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ color: '#f43f5e', fontWeight: '700' }}>Why Flagged: </span>
                  {item.explanation}
                </div>

                {/* Raw Row Values Preview */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '11px', color: '#94a3b8' }}>
                  {Object.entries(item.record || {}).slice(0, 7).map(([k, v]) => (
                    <div key={k}>
                      <span style={{ color: '#64748b' }}>{k}:</span> <b>{String(v ?? '')}</b>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
            <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px auto' }} />
            <p>No outlier anomalies matching criteria.</p>
          </div>
        )}
      </div>

    </div>
  );
}
