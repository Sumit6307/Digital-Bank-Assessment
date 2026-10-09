import React, { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, Check, AlertCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function FileUploadModal({ isOpen, onClose, onUpload, onLoadSamples }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const inputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files) => {
    const valid = files.filter(f => f.name.endsWith('.csv') || f.name.endsWith('.txt') || f.name.endsWith('.tsv'));
    if (valid.length < files.length) {
      setUploadError('Some files were ignored because only CSV / TSV format is supported.');
    } else {
      setUploadError(null);
    }
    setSelectedFiles(prev => [...prev, ...valid]);
  };

  const removeFile = (idx) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      await onUpload(selectedFiles);
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
      onClose();
    } catch (err) {
      setUploadError(err.message || 'Failed to process files.');
    } finally {
      setUploading(false);
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
        maxWidth: '560px',
        padding: '28px',
        background: '#0d1322',
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
              Upload CSV Datasets
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              Upload one or more CSV files for instant multi-table SQL querying and AI analysis.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragActive ? '#6366f1' : 'rgba(255, 255, 255, 0.15)'}`,
            borderRadius: '12px',
            padding: '36px 20px',
            textAlign: 'center',
            background: dragActive ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '18px'
          }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".csv,.tsv,.txt"
            onChange={handleChange}
            style={{ display: 'none' }}
          />
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto'
          }}>
            <Upload size={22} color="#818cf8" />
          </div>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#f8fafc', marginBottom: '4px' }}>
            Click to upload or drag & drop
          </p>
          <p style={{ fontSize: '12px', color: '#64748b' }}>
            Supports single or multiple CSV / TSV files (up to 100MB each)
          </p>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
              Selected Files ({selectedFiles.length})
            </h4>
            <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {selectedFiles.map((file, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileSpreadsheet size={15} color="#06b6d4" />
                    <span style={{ color: '#e2e8f0', fontWeight: '500' }}>{file.name}</span>
                    <span style={{ color: '#64748b', fontSize: '11px' }}>
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                    style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Notification */}
        {uploadError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#fb7185',
            marginBottom: '16px'
          }}>
            <AlertCircle size={15} />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Quick Sample Dataset Option */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          background: 'rgba(99, 102, 241, 0.07)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#f8fafc' }}>
              Want to test instantly?
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Load multi-table sample data (Sales, Customers, Products).
            </div>
          </div>
          <button
            onClick={async () => {
              await onLoadSamples();
              onClose();
            }}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            <Sparkles size={13} color="#818cf8" />
            Load Samples
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedFiles.length === 0 || uploading}
            className="btn-primary"
            style={{ opacity: selectedFiles.length === 0 ? 0.5 : 1 }}
          >
            {uploading ? 'Processing & Indexing...' : `Ingest ${selectedFiles.length} File(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}
