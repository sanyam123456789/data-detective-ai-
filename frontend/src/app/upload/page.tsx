'use client';

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShieldCheck, 
  FileCheck2,
  FolderArchive,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [uploadedDatasetId, setUploadedDatasetId] = useState<string | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setStatus('idle');
      setMessage('');
      setProgress(0);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
  });

  const handleCancel = () => {
    setFile(null);
    setUploading(false);
    setProgress(0);
    setStatus('idle');
    setMessage('');
    setUploadedDatasetId(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setStatus('idle');
    setProgress(15);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 120);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/v1/upload`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to ingest data specimen.');
      }

      const data = await response.json();
      setProgress(100);
      setStatus('success');
      setUploadedDatasetId(data.id);
      setMessage(`Evidence specimen "${data.original_filename}" securely sealed into vault storage.`);
    } catch (err: any) {
      clearInterval(progressInterval);
      setStatus('error');
      setMessage(err.message || 'An unexpected error occurred during ingestion.');
    } finally {
      setUploading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      {/* Header Docket */}
      <div className="border-b border-ruling pb-4 space-y-1">
        <div className="flex items-center gap-2">
          <span className="stamp-tag stamp-tag-amber">INTAKE PROTOCOL</span>
          <span className="text-xs font-mono text-paper-400">PROCEDURE: #EVID-INGEST-01</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-paper-50">
          Case Intake & Evidence Depository
        </h1>
        <p className="text-xs font-mono text-paper-400">
          SUBMIT DATA SPECIMENS (CSV / EXCEL) FOR FORENSIC INTERROGATION & AUDIT
        </p>
      </div>

      <div className="ledger-card p-6 md:p-8 space-y-6">
        {/* Dropzone Container */}
        {!file && (
          <div 
            {...getRootProps()} 
            className={`border border-dashed rounded p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 ${
              isDragActive 
                ? 'border-evidence-amber bg-ink-850' 
                : 'border-ruling hover:border-paper-400 bg-ink-950/60 hover:bg-ink-850'
            }`}
          >
            <input {...getInputProps()} id="dataset-file-input" />
            <div className="w-12 h-12 rounded bg-ink-800 border border-ruling flex items-center justify-center text-evidence-amber">
              <UploadCloud className="w-6 h-6" />
            </div>
            
            <div className="space-y-1 font-mono">
              <p className="text-xs font-bold text-paper-100 uppercase tracking-wide">
                Drag & Drop Evidence Specimen Here
              </p>
              <p className="text-[11px] text-paper-400">
                or click to browse filesystem registry
              </p>
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-paper-400 bg-ink-900 px-3 py-1 rounded border border-ruling">
              <ShieldCheck className="w-3.5 h-3.5 text-evidence-emerald" />
              <span>ACCEPTING .CSV, .XLSX, .XLS (MAX 50MB)</span>
            </div>
          </div>
        )}

        {/* Selected Specimen Card */}
        {file && (
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded bg-ink-950 border border-ruling flex items-center justify-between gap-4 font-mono"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded bg-ink-800 border border-ruling flex items-center justify-center text-evidence-amber shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-paper-100 truncate">{file.name}</span>
                    <span className="stamp-tag stamp-tag-cyan text-[9px]">READY</span>
                  </div>
                  <div className="text-[10px] text-paper-400 mt-0.5">
                    SPECIMEN SIZE: {formatBytes(file.size)} • MIME: {file.type || 'text/csv'}
                  </div>
                </div>
              </div>

              {!uploading && status === 'idle' && (
                <button 
                  id="remove-selected-file"
                  onClick={handleCancel}
                  aria-label="Remove specimen"
                  className="text-paper-400 hover:text-paper-100 p-1.5 hover:bg-ink-800 rounded border border-transparent hover:border-ruling transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Forensic Progress Meter */}
        {(uploading || progress > 0) && (
          <div className="space-y-2 font-mono">
            <div className="flex justify-between text-xs font-bold text-paper-300">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-evidence-amber animate-pulse" />
                <span>INGESTING SPECIMEN TO VAULT...</span>
              </span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-ink-950 rounded h-2 overflow-hidden border border-ruling">
              <div 
                className="bg-evidence-amber h-full transition-all duration-150" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Custody Status Alerts */}
        {status !== 'idle' && (
          <div className={`p-4 rounded font-mono text-xs border ${
            status === 'success' 
              ? 'bg-ink-950 text-evidence-emerald border-evidence-emerald/40' 
              : 'bg-ink-950 text-evidence-crimson border-evidence-crimson/40'
          }`}>
            <div className="flex items-start gap-3">
              {status === 'success' ? (
                <FileCheck2 className="w-5 h-5 shrink-0 text-evidence-emerald" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-evidence-crimson" />
              )}
              <div className="space-y-1">
                <p className="font-bold uppercase tracking-wider">
                  {status === 'success' ? 'CHAIN OF CUSTODY VERIFIED' : 'INGESTION FAILED'}
                </p>
                <p className="text-[11px] text-paper-300 font-body">{message}</p>
                
                {status === 'success' && uploadedDatasetId && (
                  <div className="pt-3">
                    <Link 
                      href={`/datasets/${uploadedDatasetId}`}
                      className="btn-primary text-xs inline-flex items-center gap-2"
                    >
                      <span>Open Case Dossier</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Button Bar */}
        {file && status !== 'success' && (
          <div className="flex items-center gap-3 justify-end pt-2 border-t border-ruling">
            <button
              id="cancel-upload-btn"
              disabled={uploading}
              onClick={handleCancel}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              id="submit-upload-btn"
              disabled={uploading}
              onClick={handleUpload}
              className="btn-primary text-xs"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Ingesting Specimen...</span>
                </>
              ) : (
                <>
                  <FolderArchive className="w-3.5 h-3.5" />
                  <span>Ingest Specimen to Vault</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Forensic Disclaimers & Security Protocols */}
      <div className="p-4 rounded bg-ink-950 border border-ruling font-mono text-[11px] text-paper-400 space-y-1">
        <div className="text-paper-300 font-bold uppercase flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-evidence-amber" />
          <span>Forensic Storage & Data Integrity Policy</span>
        </div>
        <p className="font-body text-paper-400 text-xs">
          Files are immutable once ingested. The system calculates checksum hashes to prevent unauthorized modifications during downstream profiling and ML training passes.
        </p>
      </div>
    </div>
  );
}
