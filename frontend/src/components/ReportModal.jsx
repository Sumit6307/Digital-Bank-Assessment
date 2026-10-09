import React, { useState } from 'react';
import { X, Download, Printer, ExternalLink, FileText, Check } from 'lucide-react';

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
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '850px',
        height: '85vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        background: '#0d1322',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#06b6d4" />
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
              Executive Intelligence Audit Report Preview
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handlePrint}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '5px 12px' }}
            >
              <Printer size={13} />
              Print / Save PDF
            </button>
            <a
              href={exportUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-primary"
              style={{ fontSize: '12px', padding: '5px 12px', textDecoration: 'none' }}
            >
              <ExternalLink size={13} />
              Open in New Tab
            </a>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', marginLeft: '6px' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Iframe Preview */}
        <div style={{ flex: 1, borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#ffffff' }}>
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
