import React, { useState } from 'react';
import { 
  Database, Table, Search, Key, Hash, Calendar, Type, FileSpreadsheet
} from 'lucide-react';

export default function DataStudioView({ overview }) {
  const [selectedTableIdx, setSelectedTableIdx] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  if (!overview || !overview.tables || overview.tables.length === 0) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        <Database size={40} style={{ margin: '0 auto 12px auto', color: 'var(--border-strong)' }} />
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>No Datasets Loaded</h3>
        <p>Upload CSV files to inspect schemas, column profiles, and data quality metrics.</p>
      </div>
    );
  }

  const currentTable = overview.tables[selectedTableIdx] || overview.tables[0];
  const quality = overview.data_quality;

  const getTypeIcon = (dtype) => {
    if (dtype.includes('int') || dtype.includes('numeric') || dtype.includes('float')) {
      return <Hash size={13} color="var(--info)" />;
    }
    if (dtype.includes('date') || dtype.includes('time')) {
      return <Calendar size={13} color="var(--warning)" />;
    }
    return <Type size={13} color="#8B5CF6" />;
  };

  const filteredPreview = currentTable.preview_data?.filter(row => {
    if (!searchTerm) return true;
    return Object.values(row).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()));
  }) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Quality & Relationships */}
      <div className="two-col">
        {/* Health Score */}
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: `conic-gradient(var(--success) ${quality?.overall_health_score || 100}%, var(--bg-secondary) 0%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '50%',
              background: 'var(--surface-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '800', fontSize: '15px', color: 'var(--success)'
            }}>
              {quality?.overall_health_score || 100}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Data Quality Score
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              {quality?.total_nulls === 0 ? 'Zero missing cells' : `${quality?.total_nulls} missing cells (${quality?.null_cell_percentage}%)`}
              {' • '}{quality?.duplicate_rows_count} duplicates
            </div>
          </div>
        </div>

        {/* Relationships */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Key size={15} color="var(--accent)" />
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Foreign Key Relationships ({overview.relationships?.length || 0})
            </span>
          </div>
          {overview.relationships && overview.relationships.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {overview.relationships.map((rel, idx) => (
                <div key={idx} style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge badge-primary">{rel.table_a}.{rel.column_a}</span>
                  <span style={{ color: 'var(--text-tertiary)' }}>⇄</span>
                  <span className="badge badge-primary">{rel.table_b}.{rel.column_b}</span>
                  <span style={{ color: 'var(--success)', fontSize: '10px', fontWeight: 600 }}>({rel.match_cardinality})</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              Single table or no foreign keys detected.
            </div>
          )}
        </div>
      </div>

      {/* Table Selector */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
        {overview.tables.map((tbl, idx) => (
          <button
            key={tbl.table_name}
            onClick={() => setSelectedTableIdx(idx)}
            className={`tab-btn ${selectedTableIdx === idx ? 'active' : ''}`}
          >
            <FileSpreadsheet size={14} />
            <span>{tbl.table_name}</span>
            <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
              {tbl.row_count.toLocaleString()}
            </span>
          </button>
        ))}
      </div>

      {/* Column Schema Table */}
      <div className="card section-card">
        <h3>
          <Table size={15} color="var(--info)" />
          Column Schema ({currentTable.columns?.length} Columns)
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Column Name</th>
                <th>Type</th>
                <th>Non-Null</th>
                <th>Unique</th>
                <th>Samples</th>
                <th>Distribution</th>
              </tr>
            </thead>
            <tbody>
              {currentTable.columns?.map((col) => (
                <tr key={col.name}>
                  <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    <code style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{col.name}</code>
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {getTypeIcon(col.dtype)}
                      {col.dtype}
                    </span>
                  </td>
                  <td>{col.non_null_count.toLocaleString()} ({100 - col.null_percentage}%)</td>
                  <td>{col.unique_count.toLocaleString()}</td>
                  <td style={{ fontSize: '11px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {col.sample_values?.slice(0, 3).join(', ')}
                  </td>
                  <td style={{ fontSize: '11px' }}>
                    {col.stats?.mean !== undefined ? (
                      <span>Mean: <b>{col.stats.mean}</b> [Min: {col.stats.min}, Max: {col.stats.max}]</span>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)' }}>Categorical</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Preview Grid */}
      <div className="card section-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ marginBottom: 0 }}>Data Preview ({filteredPreview.length} Rows)</h3>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)', padding: '4px 10px'
          }}>
            <Search size={14} color="var(--text-tertiary)" />
            <input
              type="text"
              placeholder="Search table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', padding: '4px', fontSize: '12px', width: '150px' }}
            />
          </div>
        </div>

        <div style={{ maxHeight: '380px', overflow: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <table className="data-table">
            <thead>
              <tr>
                {currentTable.columns?.map((col) => (
                  <th key={col.name}>{col.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPreview.slice(0, 100).map((row, rIdx) => (
                <tr key={rIdx}>
                  {currentTable.columns?.map((col) => (
                    <td key={col.name} style={{ whiteSpace: 'nowrap' }}>
                      {typeof row[col.name] === 'number' ? row[col.name].toLocaleString() : String(row[col.name] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
