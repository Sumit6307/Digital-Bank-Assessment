import React from 'react';
import { X, Printer, ExternalLink, FileText } from 'lucide-react';

export default function ReportModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const exportUrl = '/api/report/export';

  const handlePrint = () => {
    const printWindow = window.open(exportUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content animate-fade-up" style={{
        width: '100%', maxWidth: '850px', height: '85vh',
        display: 'flex', flexDirection: 'column', padding: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={17} color="var(--info)" />
            <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Report Preview
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button onClick={handlePrint} className="btn btn-secondary btn-sm">
              <Printer size={13} />
              Print / PDF
            </button>
            <a
              href={exportUrl} target="_blank" rel="noreferrer"
              className="btn btn-primary btn-sm"
              style={{ textDecoration: 'none' }}
            >
              <ExternalLink size={13} />
              Open in Tab
            </a>
            <button onClick={onClose} className="btn btn-ghost btn-icon">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div style={{ flex: 1, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-light)', background: '#ffffff' }}>
          <iframe
            src={exportUrl}
            title="Report Preview"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}
