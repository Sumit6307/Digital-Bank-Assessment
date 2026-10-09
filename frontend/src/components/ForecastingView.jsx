import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Calendar, RefreshCw, Sparkles, 
  ArrowUpRight, Activity, ChevronRight
} from 'lucide-react';
import { Line } from 'react-chartjs-2';

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
      const res = await fetch('/api/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_name: selectedTable,
          date_column: dateCol,
          metric_column: metricCol,
          horizon_periods: horizon,
          frequency: frequency
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Forecasting failed');
      }
      const data = await res.json();
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

  // Build Chart.js structure for historical + forecast + confidence bands
  const chartData = forecastResult ? {
    labels: forecastResult.points.map(p => p.date),
    datasets: [
      {
        label: 'Historical Actuals',
        data: forecastResult.points.map(p => p.actual),
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        borderWidth: 2,
        pointRadius: 2,
        tension: 0.2
      },
      {
        label: 'Projected Forecast',
        data: forecastResult.points.map(p => p.forecast),
        borderColor: '#a855f7',
        borderDash: [5, 5],
        borderWidth: 2.5,
        pointRadius: 2,
        tension: 0.2
      },
      {
        label: 'Upper 95% Confidence Band',
        data: forecastResult.points.map(p => p.upper_bound),
        borderColor: 'rgba(168, 85, 247, 0.25)',
        backgroundColor: 'rgba(168, 85, 247, 0.08)',
        borderWidth: 1,
        fill: '+1',
        pointRadius: 0
      },
      {
        label: 'Lower 95% Confidence Band',
        data: forecastResult.points.map(p => p.lower_bound),
        borderColor: 'rgba(168, 85, 247, 0.25)',
        borderWidth: 1,
        pointRadius: 0
      }
    ]
  } : null;

  return (
    <div style={{ padding: '0 16px 24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Controls Bar */}
      <div className="glass-card" style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="#a855f7" />
              Predictive Time-Series Forecasting Studio
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              Project future demand, revenue trajectories, and statistical confidence bands.
            </p>
          </div>
          <button onClick={handleRunForecast} className="btn-primary" style={{ fontSize: '12px' }}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Recalculate Model
          </button>
        </div>

        {/* Dimension Selectors */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '14px',
          paddingTop: '14px',
          borderTop: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              TARGET TABLE
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

          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              DATE / TIME DIMENSION
            </label>
            <select
              value={dateCol}
              onChange={(e) => setDateCol(e.target.value)}
              style={{ width: '100%' }}
            >
              {currentTableSchema?.columns?.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
              TARGET NUMERIC METRIC
            </label>
            <select
              value={metricCol}
              onChange={(e) => setMetricCol(e.target.value)}
              style={{ width: '100%' }}
            >
              {currentTableSchema?.columns?.filter(c => c.is_numeric).map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8' }}>
                HORIZON PERIODS: {horizon}
              </label>
            </div>
            <input
              type="range"
              min="7"
              max="90"
              step="1"
              value={horizon}
              onChange={(e) => setHorizon(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#a855f7' }}
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="glass-card" style={{ padding: '14px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* KPI Cards for Forecast */}
      {forecastResult && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px'
        }}>
          <div className="glass-card" style={{ padding: '16px 18px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Trajectory Trend</span>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#34d399', marginTop: '4px' }}>
              {forecastResult.trend_direction}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '16px 18px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Historical Growth</span>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', marginTop: '4px' }}>
              {forecastResult.growth_rate_pct > 0 ? `+${forecastResult.growth_rate_pct}%` : `${forecastResult.growth_rate_pct}%`}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '16px 18px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Forecast Horizon</span>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#a855f7', marginTop: '4px' }}>
              +{forecastResult.forecast_count} Periods
            </div>
          </div>
        </div>
      )}

      {/* Interactive Forecast Graph */}
      {chartData && (
        <div className="glass-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', marginBottom: '14px' }}>
            {metricCol.replace(/_/g, ' ').toUpperCase()} Forecast Curve & 95% Confidence Bounds
          </h3>
          <div style={{ height: '340px' }}>
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', maxRotation: 45 } },
                  y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
                },
                plugins: {
                  legend: { position: 'top', labels: { color: '#cbd5e1' } }
                }
              }}
            />
          </div>

          {forecastResult?.summary_insight && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: 'rgba(168, 85, 247, 0.08)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#e2e8f0',
              lineHeight: 1.5
            }}>
              <b>Forecast Model Takeaway:</b> {forecastResult.summary_insight}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
