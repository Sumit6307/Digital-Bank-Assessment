import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, RefreshCw
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { api } from '../services/api';

export default function ForecastingView({ overview }) {
  const [selectedTable, setSelectedTable] = useState('');
  const [dateCol, setDateCol] = useState('');
  const [metricCol, setMetricCol] = useState('');
  const [horizon, setHorizon] = useState(30);
  const [frequency, setFrequency] = useState('D');
  const [forecastResult, setForecastResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentTableSchema = overview?.tables?.find(t => t.table_name === selectedTable) || overview?.tables?.[0];

  useEffect(() => {
    if (overview?.tables?.length > 0) {
      const firstTbl = overview.tables[0];
      setSelectedTable(firstTbl.table_name);
      
      const dtCol = firstTbl.columns.find(c => c.is_datetime || c.name.toLowerCase().includes('date'))?.name || firstTbl.columns[0].name;
      const numCol = firstTbl.columns.find(c => c.is_numeric && (c.name.includes('sales') || c.name.includes('amount') || c.name.includes('profit') || c.name.includes('revenue')))?.name || 
                     firstTbl.columns.find(c => c.is_numeric)?.name || '';

      setDateCol(dtCol);
      setMetricCol(numCol);
    }
  }, [overview]);

  const handleRunForecast = async () => {
    if (!selectedTable || !dateCol || !metricCol) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getForecast({
        table_name: selectedTable,
        date_column: dateCol,
        metric_column: metricCol,
        horizon_periods: horizon,
        frequency: frequency
      });
      setForecastResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTable && dateCol && metricCol) {
      handleRunForecast();
    }
  }, [selectedTable, dateCol, metricCol, horizon, frequency]);

  const chartData = forecastResult ? {
    labels: forecastResult.points.map(p => p.date),
    datasets: [
      {
        label: 'Historical Actuals',
        data: forecastResult.points.map(p => p.actual),
        borderColor: '#0EA5E9',
        backgroundColor: 'rgba(14, 165, 233, 0.08)',
        borderWidth: 2,
        pointRadius: 2,
        tension: 0.2
      },
      {
        label: 'Projected Forecast',
        data: forecastResult.points.map(p => p.forecast),
        borderColor: '#8B5CF6',
        borderDash: [5, 5],
        borderWidth: 2.5,
        pointRadius: 2,
        tension: 0.2
      },
      {
        label: 'Upper 95% Confidence',
        data: forecastResult.points.map(p => p.upper_bound),
        borderColor: 'rgba(139, 92, 246, 0.2)',
        backgroundColor: 'rgba(139, 92, 246, 0.06)',
        borderWidth: 1,
        fill: '+1',
        pointRadius: 0
      },
      {
        label: 'Lower 95% Confidence',
        data: forecastResult.points.map(p => p.lower_bound),
        borderColor: 'rgba(139, 92, 246, 0.2)',
        borderWidth: 1,
        pointRadius: 0
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#9CA3AF', maxRotation: 45, font: { family: 'Inter', size: 11 } } },
      y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { color: '#9CA3AF', font: { family: 'Inter', size: 11 } } }
    },
    plugins: {
      legend: { position: 'top', labels: { color: '#6B7280', font: { family: 'Inter', size: 11 } } }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Controls */}
      <div className="card section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h3 style={{ marginBottom: '2px' }}>
              <TrendingUp size={17} color="#8B5CF6" />
              Forecasting Lab
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>
              Project future trends with statistical confidence bands.
            </p>
          </div>
          <button onClick={handleRunForecast} className="btn btn-primary btn-sm">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Recalculate
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          paddingTop: '14px',
          borderTop: '1px solid var(--border-light)'
        }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Table
            </label>
            <select value={selectedTable} onChange={(e) => setSelectedTable(e.target.value)} style={{ width: '100%' }}>
              {overview?.tables?.map((t) => (
                <option key={t.table_name} value={t.table_name}>{t.table_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Date Column
            </label>
            <select value={dateCol} onChange={(e) => setDateCol(e.target.value)} style={{ width: '100%' }}>
              {currentTableSchema?.columns?.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Metric
            </label>
            <select value={metricCol} onChange={(e) => setMetricCol(e.target.value)} style={{ width: '100%' }}>
              {currentTableSchema?.columns?.filter(c => c.is_numeric).map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Horizon: {horizon}
              </label>
            </div>
            <input
              type="range" min="7" max="90" step="1"
              value={horizon}
              onChange={(e) => setHorizon(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#8B5CF6' }}
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card" style={{ padding: '14px', background: 'var(--danger-light)', borderColor: 'var(--danger-border)', color: 'var(--danger)', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* KPIs */}
      {forecastResult && (
        <div className="metric-grid">
          <div className="card metric-card animate-fade-up">
            <div className="metric-label">Trend Direction</div>
            <div className="metric-value" style={{ fontSize: '18px', color: 'var(--success)' }}>
              {forecastResult.trend_direction}
            </div>
          </div>
          <div className="card metric-card animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <div className="metric-label">Historical Growth</div>
            <div className="metric-value" style={{ fontSize: '18px' }}>
              {forecastResult.growth_rate_pct > 0 ? `+${forecastResult.growth_rate_pct}%` : `${forecastResult.growth_rate_pct}%`}
            </div>
          </div>
          <div className="card metric-card animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="metric-label">Forecast Horizon</div>
            <div className="metric-value" style={{ fontSize: '18px', color: '#8B5CF6' }}>
              +{forecastResult.forecast_count} Periods
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData && (
        <div className="card section-card">
          <h3 style={{ marginBottom: '14px' }}>
            {metricCol.replace(/_/g, ' ').toUpperCase()} — Forecast & Confidence Bands
          </h3>
          <div style={{ height: '340px' }}>
            <Line data={chartData} options={chartOptions} />
          </div>

          {forecastResult?.summary_insight && (
            <div style={{
              marginTop: '16px', padding: '12px 16px',
              background: 'var(--accent-light)', border: '1px solid var(--accent-muted)',
              borderRadius: 'var(--radius-md)',
              fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.55
            }}>
              <b>Model Insight:</b> {forecastResult.summary_insight}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
