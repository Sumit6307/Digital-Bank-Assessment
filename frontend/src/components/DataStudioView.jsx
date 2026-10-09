import React, { useState } from 'react';
import { 
  Database, Table, CheckCircle2, AlertTriangle, 
  Search, ShieldCheck, FileSpreadsheet, Key, Hash, Calendar, Type
} from 'lucide-react';

export default function DataStudioView({ overview }) {
  const [selectedTableIdx, setSelectedTableIdx] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  if (!overview || !overview.tables || overview.tables.length === 0) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
        <Database size={40} style={{ margin: '0 auto 12px auto', color: '#64748b' }} />
        <h3>No Datasets Loaded</h3>
        <p>Upload CSV files to inspect schemas, column profiles, and data quality metrics.</p>
      </div>
    );
  }

  const currentTable = overview.tables[selectedTableIdx] || overview.tables[0];
  const quality = overview.data_quality;

  const getTypeIcon = (dtype) => {
    if (dtype.includes('int') || dtype.includes('numeric') || dtype.includes('float')) {
      return <Hash size={13} color="#06b6d4" />;
    }
    if (dtype.includes('date') || dtype.includes('time')) {
      return <Calendar size={13} color="#f59e0b" />;
    }
    return <Type size={13} color="#a855f7" />;
  };

  const filteredPreview = currentTable.preview_data?.filter(row => {
    if (!searchTerm) return true;
    return Object.values(row).some(v => String(v).toLowerCase().includes(searchTerm.toLowerCase()));
  }) || [];

  return (
    <div style={{ padding: '0 16px 24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Quality Score Card & Relationship Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {/* Quality Score Meter */}
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: `conic-gradient(#10b981 ${quality?.overall_health_score || 100}%, rgba(255,255,255,0.08) 0%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: '#0d1322',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '15px',
              color: '#34d399'
            }}>
              {quality?.overall_health_score || 100}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc' }}>
              Data Quality Health Score
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
              {quality?.total_nulls === 0 ? 'Zero missing null cells' : `${quality?.total_nulls} missing cells (${quality?.null_cell_percentage}%)`}
              {' • '}{quality?.duplicate_rows_count} duplicates
            </div>
          </div>
        </div>

        {/* Multi-Table Relationship Card */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Key size={16} color="#6366f1" />
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#f8fafc' }}>
              Detected Foreign Key Relationships ({overview.relationships?.length || 0})
            </span>
          </div>
          {overview.relationships && overview.relationships.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {overview.relationships.map((rel, idx) => (
                <div key={idx} style={{ fontSize: '11px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge badge-primary">{rel.table_a}.{rel.column_a}</span>
                  <span style={{ color: '#64748b' }}>⇄</span>
                  <span className="badge badge-primary">{rel.table_b}.{rel.column_b}</span>
                  <span style={{ color: '#34d399', fontSize: '10px' }}>({rel.match_cardinality})</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Single table or no foreign keys detected across datasets.
            </div>
          )}
        </div>
      </div>

      {/* Table Selector Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
        {overview.tables.map((tbl, idx) => (
          <button
            key={tbl.table_name}
            onClick={() => setSelectedTableIdx(idx)}
            className={`tab-btn ${selectedTableIdx === idx ? 'active' : ''}`}
          >
            <FileSpreadsheet size={15} />
            <span>{tbl.table_name}</span>
            <span style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '9999px',
              background: 'rgba(255,255,255,0.1)',
              color: '#cbd5e1'
            }}>
              {tbl.row_count.toLocaleString()} rows
            </span>
          </button>
        ))}
      </div>

      {/* Column Schema & Profiling Table */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Table size={16} color="#06b6d4" />
          Column Schema & Profiling ({currentTable.columns?.length} Columns)
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ padding: '10px 14px', color: '#94a3b8' }}>Column Name</th>
                <th style={{ padding: '10px 14px', color: '#94a3b8' }}>Data Type</th>
                <th style={{ padding: '10px 14px', color: '#94a3b8' }}>Non-Null Count</th>
                <th style={{ padding: '10px 14px', color: '#94a3b8' }}>Unique Values</th>
                <th style={{ padding: '10px 14px', color: '#94a3b8' }}>Sample Values</th>
                <th style={{ padding: '10px 14px', color: '#94a3b8' }}>Distribution Summary</th>
              </tr>
            </thead>
            <tbody>
              {currentTable.columns?.map((col) => (
                <tr key={col.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '9px 14px', fontWeight: '600', color: '#f8fafc' }}>
                    <code>{col.name}</code>
                  </td>
                  <td style={{ padding: '9px 14px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#cbd5e1' }}>
                      {getTypeIcon(col.dtype)}
                      {col.dtype}
                    </span>
                  </td>
                  <td style={{ padding: '9px 14px', color: '#cbd5e1' }}>
                    {col.non_null_count.toLocaleString()} ({100 - col.null_percentage}%)
                  </td>
                  <td style={{ padding: '9px 14px', color: '#cbd5e1' }}>
                    {col.unique_count.toLocaleString()}
                  </td>
                  <td style={{ padding: '9px 14px', color: '#94a3b8', fontSize: '11px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {col.sample_values?.slice(0, 3).join(', ')}
                  </td>
                  <td style={{ padding: '9px 14px', color: '#94a3b8', fontSize: '11px' }}>
                    {col.stats?.mean !== undefined ? (
                      <span>Mean: <b>{col.stats.mean}</b> [Min: {col.stats.min}, Max: {col.stats.max}]</span>
                    ) : (
                      <span>Categorical dimension</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 100 Row Data Preview Grid */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f8fafc' }}>
            Data Grid Preview ({filteredPreview.length} Rows)
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#090e18', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '4px 10px' }}>
            <Search size={14} color="#64748b" />
            <input
              type="text"
              placeholder="Search table..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', padding: '2px', fontSize: '12px' }}
            />
          </div>
        </div>

        <div style={{ maxHeight: '380px', overflow: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f172a' }}>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {currentTable.columns?.map((col) => (
                  <th key={col.name} style={{ padding: '9px 12px', color: '#94a3b8', fontWeight: '600' }}>
                    {col.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPreview.slice(0, 100).map((row, rIdx) => (
                <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  {currentTable.columns?.map((col) => (
                    <td key={col.name} style={{ padding: '8px 12px', color: '#e2e8f0', whiteSpace: 'nowrap' }}>
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
