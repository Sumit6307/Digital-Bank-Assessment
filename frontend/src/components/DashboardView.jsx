import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Database, 
  Activity, PieChart, ShieldAlert, Award, ArrowUpRight,
  Sparkles, RefreshCw
} from 'lucide-react';
import DynamicChart from './DynamicChart';

export default function DashboardView({ overview, onNavigateToTab }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState('');

  const fetchDashboard = async (tbl = null) => {
    setLoading(true);
    try {
      const url = tbl ? `/api/dashboard?table_name=${tbl}` : '/api/dashboard';
      const res = await fetch(url);
      const data = await res.json();
      setDashboardData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (overview?.tables?.length > 0) {
      const defaultTbl = selectedTable || overview.tables[0].table_name;
      setSelectedTable(defaultTbl);
      fetchDashboard(defaultTbl);
    }
  }, [overview]);

  const handleTableChange = (tName) => {
    setSelectedTable(tName);
    fetchDashboard(tName);
  };

  const getKpiIcon = (label) => {
    const l = label.toLowerCase();
    if (l.includes('revenue') || l.includes('sales') || l.includes('spend')) return <DollarSign size={20} color="#06b6d4" />;
    if (l.includes('profit') || l.includes('margin')) return <PieChart size={20} color="#10b981" />;
    if (l.includes('record') || l.includes('volume') || l.includes('count')) return <Database size={20} color="#6366f1" />;
    return <Activity size={20} color="#f59e0b" />;
  };

  if (loading && !dashboardData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#6366f1' }} />
        <p>Synthesizing Automated Executive Intelligence Dashboard...</p>
      </div>
    );
  }

  if (!dashboardData || (!dashboardData.kpis && !dashboardData.charts)) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
        <Database size={40} style={{ margin: '0 auto 12px auto', color: '#64748b' }} />
        <h3>No Data Available</h3>
        <p>Upload a CSV dataset to generate an automated executive intelligence dashboard.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 16px 24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Selector & Overview Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#6366f1" />
            Executive Auto-Dashboard
          </h2>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>
            Instant real-time KPIs, distributions, correlation, and strategic takeaways.
          </p>
        </div>

        {/* Dataset Switcher Dropdown */}
        {overview?.tables?.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Target Table:</span>
            <select
              value={selectedTable}
              onChange={(e) => handleTableChange(e.target.value)}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              {overview.tables.map((t) => (
                <option key={t.table_name} value={t.table_name}>
                  {t.table_name} ({t.row_count} rows)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Dynamic Executive KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {dashboardData.kpis?.map((kpi, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {kpi.label}
              </span>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {getKpiIcon(kpi.label)}
              </div>
            </div>

            <div style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px', marginBottom: '6px' }}>
              {kpi.value}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
              {kpi.change_pct !== null && kpi.change_pct !== undefined ? (
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontWeight: '700',
                  color: kpi.change_pct >= 0 ? '#34d399' : '#fb7185'
                }}>
                  {kpi.change_pct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {kpi.change_pct >= 0 ? `+${kpi.change_pct}%` : `${kpi.change_pct}%`}
                </span>
              ) : null}
              <span style={{ color: '#64748b' }}>{kpi.description}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Executive Strategic Summary Box */}
      {dashboardData.executive_summary && (
        <div className="glass-card" style={{
          padding: '18px 22px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={16} color="#818cf8" />
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc' }}>
              Strategic Executive Narrative
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.6 }}>
            {dashboardData.executive_summary}
          </p>
        </div>
      )}

      {/* Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
        gap: '16px'
      }}>
        {dashboardData.charts?.map((chart, idx) => (
          <div key={idx}>
            <DynamicChart config={chart} height={260} />
          </div>
        ))}
      </div>

      {/* Two Column Section: Top Performers & Actionable Recommendations */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '16px'
      }}>
        {/* Top Performers Leaderboard */}
        {dashboardData.top_performers && dashboardData.top_performers.length > 0 && (
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Award size={16} color="#f59e0b" />
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc' }}>
                Top Performers Leaderboard
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {dashboardData.top_performers.map((p, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: idx === 0 ? '#f59e0b' : (idx === 1 ? '#94a3b8' : '#64748b'),
                      color: '#000000',
                      fontSize: '11px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>
                      {p.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#34d399' }}>
                    ${p.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Actions & Risk Factors */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <ShieldAlert size={16} color="#06b6d4" />
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc' }}>
              Identified Risks & Recommendations
            </h3>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#fb7185', textTransform: 'uppercase', marginBottom: '6px' }}>
              Risk Vectors
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
              {dashboardData.risk_factors?.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: '600', color: '#34d399', textTransform: 'uppercase', marginBottom: '6px' }}>
              Recommended Strategic Actions
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
              {dashboardData.suggested_actions?.map((a, idx) => (
                <li key={idx}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

    </div>
  );
}
