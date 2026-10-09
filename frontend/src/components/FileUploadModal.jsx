import React, { useState, useRef } from 'react';
import { Upload, X, FileSpreadsheet, AlertCircle, Sparkles } from 'lucide-react';
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
      setUploadError('Some files were ignored — only CSV / TSV format is supported.');
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
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content animate-fade-up" style={{ width: '100%', maxWidth: '520px', padding: '28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>Upload Datasets</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              Upload CSV files for instant SQL querying and AI analysis.
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragActive ? 'var(--accent)' : 'var(--border-default)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '32px 20px',
            textAlign: 'center',
            background: dragActive ? 'var(--accent-light)' : 'var(--bg-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '18px'
          }}
        >
          <input ref={inputRef} type="file" multiple accept=".csv,.tsv,.txt" onChange={handleChange} style={{ display: 'none' }} />
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            background: 'var(--accent-light)', border: '1px solid var(--accent-muted)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px auto'
          }}>
            <Upload size={22} color="var(--accent)" />
          </div>
          <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Click to upload or drag & drop
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            CSV / TSV files (up to 100MB each)
          </p>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
              Selected ({selectedFiles.length})
            </h4>
            <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {selectedFiles.map((file, idx) => (
                <div key={idx} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)',
                  fontSize: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileSpreadsheet size={15} color="var(--info)" />
                    <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{file.name}</span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="btn btn-ghost btn-icon btn-sm">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {uploadError && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 14px', background: 'var(--danger-light)',
            border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-md)',
            fontSize: '12px', color: 'var(--danger)', marginBottom: '14px'
          }}>
            <AlertCircle size={15} />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Sample Data Prompt */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '12px 16px', background: 'var(--accent-light)',
          border: '1px solid var(--accent-muted)', borderRadius: 'var(--radius-md)', marginBottom: '20px'
        }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Quick test?</div>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Load sample data (Sales, Customers, Products).</div>
          </div>
          <button onClick={async () => { await onLoadSamples(); onClose(); }} className="btn btn-secondary btn-sm">
            <Sparkles size={13} color="var(--accent)" />
            Load Samples
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={selectedFiles.length === 0 || uploading}
            className="btn btn-primary"
            style={{ opacity: selectedFiles.length === 0 ? 0.5 : 1 }}
          >
            {uploading ? 'Processing...' : `Upload ${selectedFiles.length} File(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}
