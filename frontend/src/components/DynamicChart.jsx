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

  // Refined palette — harmonious, not generic
  const palette = [
    '#6366F1', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#3B82F6', '#84CC16'
  ];

  const backgroundColors = data.map((_, i) => palette[i % palette.length] + 'cc');
  const borderColors = data.map((_, i) => palette[i % palette.length]);

  const values = data.map((item) => {
    if (y_axis && item[y_axis] !== undefined) {
      const v = Number(item[y_axis]);
      return isNaN(v) ? 0 : v;
    }
    const numKey = Object.keys(item).find((k) => typeof item[k] === 'number');
    return numKey ? item[numKey] : 0;
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: y_axis ? y_axis.replace(/_/g, ' ').toUpperCase() : 'VALUE',
        data: values,
        backgroundColor: chart_type === 'line' || chart_type === 'area' ? 'rgba(99, 102, 241, 0.1)' : backgroundColors,
        borderColor: chart_type === 'line' || chart_type === 'area' ? '#6366F1' : borderColors,
        borderWidth: chart_type === 'line' ? 2.5 : 1.5,
        fill: chart_type === 'area',
        tension: 0.35,
        pointBackgroundColor: '#6366F1',
        pointBorderColor: '#ffffff',
        pointRadius: 3,
        pointHoverRadius: 6,
        borderRadius: chart_type === 'bar' ? 6 : 0,
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
          color: '#6B7280',
          font: { family: 'Inter, sans-serif', size: 11 },
          boxWidth: 12,
        },
      },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#111827',
        bodyColor: '#4B5563',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        boxPadding: 4,
        usePointStyle: true,
        cornerRadius: 8,
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
              grid: { color: 'rgba(0, 0, 0, 0.04)' },
              ticks: {
                color: '#9CA3AF',
                font: { family: 'Inter, sans-serif', size: 11 },
                maxRotation: 45,
                minRotation: 0,
              },
            },
            y: {
              grid: { color: 'rgba(0, 0, 0, 0.04)' },
              ticks: {
                color: '#9CA3AF',
                font: { family: 'Inter, sans-serif', size: 11 },
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
              backgroundColor: '#EC4899',
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
    <div className="card" style={{ padding: '18px', marginTop: '10px', marginBottom: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={16} color="var(--accent)" />
            {title || 'Visualization'}
          </h4>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            {chart_type?.toUpperCase()} • {data.length} data points
          </span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setShowTable(!showTable)}
            className="btn btn-secondary btn-sm"
            title={showTable ? 'Switch to Chart' : 'View Data Table'}
          >
            <TableIcon size={13} />
            {showTable ? 'Chart' : 'Data'}
          </button>
          <button
            onClick={downloadChart}
            className="btn btn-secondary btn-sm"
            title="Download PNG"
          >
            <Download size={13} />
          </button>
        </div>
      </div>

      {showTable ? (
        <div style={{ maxHeight: `${height}px`, overflowY: 'auto', overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 50).map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col}>
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
