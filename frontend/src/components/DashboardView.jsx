import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, DollarSign, Database, 
  Activity, PieChart, ShieldAlert, Award,
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
    if (l.includes('revenue') || l.includes('sales') || l.includes('spend')) return <DollarSign size={20} color="var(--info)" />;
    if (l.includes('profit') || l.includes('margin')) return <PieChart size={20} color="var(--success)" />;
    if (l.includes('record') || l.includes('volume') || l.includes('count')) return <Database size={20} color="var(--accent)" />;
    return <Activity size={20} color="var(--warning)" />;
  };

  if (loading && !dashboardData) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px auto', color: 'var(--accent)' }} />
        <p style={{ fontWeight: 500 }}>Building your dashboard...</p>
      </div>
    );
  }

  if (!dashboardData || (!dashboardData.kpis && !dashboardData.charts)) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        <Database size={40} style={{ margin: '0 auto 12px auto', color: 'var(--border-strong)' }} />
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>No Data Available</h3>
        <p>Upload a CSV dataset to generate an executive dashboard.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--accent)" />
            Executive Dashboard
          </h2>
          <p>Real-time KPIs, distributions, and strategic insights.</p>
        </div>

        {overview?.tables?.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500 }}>Dataset:</span>
            <select
              value={selectedTable}
              onChange={(e) => handleTableChange(e.target.value)}
              style={{ padding: '6px 12px', fontSize: '12px', width: 'auto' }}
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

      {/* KPI Cards */}
      <div className="metric-grid">
        {dashboardData.kpis?.map((kpi, idx) => (
          <div key={idx} className="card metric-card animate-fade-up" style={{ animationDelay: `${idx * 0.05}s` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="metric-label">{kpi.label}</div>
              <div style={{
                width: '34px', height: '34px', borderRadius: '8px',
                background: 'var(--bg-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {getKpiIcon(kpi.label)}
              </div>
            </div>
            <div className="metric-value">{kpi.value}</div>
            <div className="metric-sub">
              {kpi.change_pct !== null && kpi.change_pct !== undefined ? (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: '2px', fontWeight: '700',
                  color: kpi.change_pct >= 0 ? 'var(--success)' : 'var(--danger)'
                }}>
                  {kpi.change_pct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {kpi.change_pct >= 0 ? `+${kpi.change_pct}%` : `${kpi.change_pct}%`}
                </span>
              ) : null}
              <span>{kpi.description}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Executive Summary */}
      {dashboardData.executive_summary && (
        <div className="card section-card" style={{
          background: 'var(--accent-light)',
          borderColor: 'var(--accent-muted)'
        }}>
          <h3>
            <Sparkles size={16} color="var(--accent)" />
            Executive Summary
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            {dashboardData.executive_summary}
          </p>
        </div>
      )}

      {/* Charts Grid */}
      <div className="charts-grid">
        {dashboardData.charts?.map((chart, idx) => (
          <div key={idx}>
            <DynamicChart config={chart} height={260} />
          </div>
        ))}
      </div>

      {/* Two Column Section: Top Performers & Recommendations */}
      <div className="two-col">
        {/* Top Performers */}
        {dashboardData.top_performers && dashboardData.top_performers.length > 0 && (
          <div className="card section-card">
            <h3>
              <Award size={16} color="var(--warning)" />
              Top Performers
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {dashboardData.top_performers.map((p, idx) => (
                <div key={idx} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: idx === 0 ? 'var(--warning)' : (idx === 1 ? 'var(--border-strong)' : 'var(--border-default)'),
                      color: idx === 0 ? '#fff' : 'var(--text-primary)',
                      fontSize: '11px', fontWeight: '800',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {idx + 1}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {p.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--success)' }}>
                    ${p.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Risks & Actions */}
        <div className="card section-card">
          <h3>
            <ShieldAlert size={16} color="var(--info)" />
            Risks & Recommendations
          </h3>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              Risk Factors
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {dashboardData.risk_factors?.map((r, idx) => (
                <li key={idx}>{r}</li>
              ))}
            </ul>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              Recommended Actions
            </div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
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
