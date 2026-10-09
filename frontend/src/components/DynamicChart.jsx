import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, Scatter } from 'react-chartjs-2';
import { Download, Table as TableIcon, BarChart2 } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DynamicChart({ config, height = 320 }) {
  const chartRef = useRef(null);
  const [showTable, setShowTable] = React.useState(false);

  if (!config || !config.data || config.data.length === 0) {
    return null;
  }

  const { chart_type, title, x_axis, y_axis, data } = config;

  const labels = data.map((item, idx) => {
    if (x_axis && item[x_axis] !== undefined) {
      return String(item[x_axis]);
    }
    return `Item ${idx + 1}`;
  });

  const vibrantColors = [
    '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899',
    '#8b5cf6', '#14b8a6', '#f97316', '#3b82f6', '#84cc16'
  ];

  const backgroundColors = data.map((_, i) => vibrantColors[i % vibrantColors.length] + 'cc');
  const borderColors = data.map((_, i) => vibrantColors[i % vibrantColors.length]);

  // Extract Y values
  const values = data.map((item) => {
    if (y_axis && item[y_axis] !== undefined) {
      const v = Number(item[y_axis]);
      return isNaN(v) ? 0 : v;
    }
    // Fallback to first numeric property
    const numKey = Object.keys(item).find((k) => typeof item[k] === 'number');
    return numKey ? item[numKey] : 0;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: y_axis ? y_axis.replace(/_/g, ' ').toUpperCase() : 'VALUE',
        data: values,
        backgroundColor: chart_type === 'line' || chart_type === 'area' ? 'rgba(99, 102, 241, 0.15)' : backgroundColors,
        borderColor: chart_type === 'line' || chart_type === 'area' ? '#6366f1' : borderColors,
        borderWidth: chart_type === 'line' ? 3 : 1.5,
        fill: chart_type === 'area',
        tension: 0.35,
        pointBackgroundColor: '#818cf8',
        pointBorderColor: '#ffffff',
        pointRadius: 4,
        pointHoverRadius: 7,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: chart_type === 'pie' || chart_type === 'doughnut',
        position: 'right',
        labels: {
          color: '#94a3b8',
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
          boxWidth: 12,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null && context.parsed.y !== undefined) {
              label += Number(context.parsed.y).toLocaleString(undefined, { maximumFractionDigits: 2 });
            } else if (context.parsed !== null) {
              label += Number(context.parsed).toLocaleString(undefined, { maximumFractionDigits: 2 });
            }
            return label;
          },
        },
      },
    },
    scales:
      chart_type === 'pie' || chart_type === 'doughnut'
        ? {}
        : {
            x: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: {
                color: '#94a3b8',
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
                maxRotation: 45,
                minRotation: 0,
              },
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: {
                color: '#94a3b8',
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
                callback: function (val) {
                  return Number(val).toLocaleString();
                },
              },
            },
          },
  };

  const downloadChart = () => {
    if (chartRef.current) {
      const url = chartRef.current.toBase64Image();
      const link = document.createElement('a');
      link.download = `${(title || 'chart').toLowerCase().replace(/\s+/g, '_')}.png`;
      link.href = url;
      link.click();
    }
  };

  const renderChartComponent = () => {
    switch (chart_type?.toLowerCase()) {
      case 'line':
      case 'area':
        return <Line ref={chartRef} data={chartData} options={chartOptions} />;
      case 'pie':
        return <Pie ref={chartRef} data={chartData} options={chartOptions} />;
      case 'doughnut':
        return <Doughnut ref={chartRef} data={chartData} options={chartOptions} />;
      case 'scatter':
        const scatterData = {
          datasets: [
            {
              label: y_axis || 'Scatter Points',
              data: data.map((d) => ({
                x: Number(d[x_axis]) || 0,
                y: Number(d[y_axis]) || 0,
              })),
              backgroundColor: '#ec4899',
            },
          ],
        };
        return <Scatter ref={chartRef} data={scatterData} options={chartOptions} />;
      case 'bar':
      default:
        return <Bar ref={chartRef} data={chartData} options={chartOptions} />;
    }
  };

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="glass-card p-4 my-3" style={{ background: '#0a0f1d', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={16} color="#6366f1" />
            {title || 'Visualization'}
          </h4>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            {chart_type?.toUpperCase()} • {data.length} data points
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setShowTable(!showTable)}
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '11px' }}
            title={showTable ? 'Switch to Chart' : 'View Data Table'}
          >
            <TableIcon size={13} />
            {showTable ? 'Chart' : 'Data'}
          </button>
          <button
            onClick={downloadChart}
            className="btn-secondary"
            style={{ padding: '4px 10px', fontSize: '11px' }}
            title="Download PNG"
          >
            <Download size={13} />
          </button>
        </div>
      </div>

      {showTable ? (
        <div style={{ maxHeight: `${height}px`, overflowY: 'auto', overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {columns.map((col) => (
                  <th key={col} style={{ padding: '8px 12px', color: '#94a3b8', fontWeight: '600' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 50).map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  {columns.map((col) => (
                    <td key={col} style={{ padding: '7px 12px', color: '#e2e8f0' }}>
                      {typeof row[col] === 'number' ? row[col].toLocaleString() : String(row[col] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ height: `${height}px`, position: 'relative' }}>
          {renderChartComponent()}
        </div>
      )}
    </div>
  );
}
