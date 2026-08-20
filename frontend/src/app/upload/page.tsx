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
      {/* Header */}
      <div className="border-b border-[#382A34] pb-4 space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="stamp-tag stamp-tag-amber">DATA INTAKE</span>
          <span className="text-xs font-mono text-[#D6C7C2] font-medium">UPLOAD & PROFILING</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#FAF5F6]">
          Upload Dataset
        </h1>
        <p className="text-xs font-mono text-[#D6C7C2]">
          SUBMIT CSV OR EXCEL FILES FOR AUTOMATED PROFILING, QUALITY AUDITING & LAKEHOUSE PIPELINES
        </p>
      </div>

      <div className="ledger-card p-6 md:p-8 space-y-6">
        {/* Dropzone Container */}
        {!file && (
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 ${
              isDragActive 
                ? 'border-[#C89D66] bg-[#C89D66]/10' 
                : 'border-[#382A34] hover:border-[#C89D66]/60 bg-[#181216] hover:bg-[#261E24]'
            }`}
          >
            <input {...getInputProps()} id="dataset-file-input" />
            <div className="w-14 h-14 rounded-xl bg-[#C89D66]/15 border border-[#C89D66]/40 flex items-center justify-center text-[#C89D66] shadow-sm">
              <UploadCloud className="w-7 h-7" />
            </div>
            
            <div className="space-y-1 font-mono">
              <p className="text-sm font-bold text-[#FAF5F6] uppercase tracking-wide">
                Drag & Drop Dataset File Here
              </p>
              <p className="text-xs text-[#D6C7C2] font-sans">
                or click to browse local filesystem
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-[#D6C7C2] bg-[#141013] px-3 py-1.5 rounded-lg border border-[#382A34]">
              <ShieldCheck className="w-4 h-4 text-[#5FA788]" />
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
              className="p-4 rounded-xl bg-[#181216] border border-[#382A34] flex items-center justify-between gap-4 font-mono"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-[#C89D66]/15 border border-[#C89D66]/30 flex items-center justify-center text-[#C89D66] shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#FAF5F6] truncate">{file.name}</span>
                    <span className="stamp-tag stamp-tag-cyan text-[9px]">READY</span>
                  </div>
                  <div className="text-[11px] text-[#D6C7C2] mt-0.5">
                    SIZE: {formatBytes(file.size)} • MIME: {file.type || 'text/csv'}
                  </div>
                </div>
              </div>

              {!uploading && status === 'idle' && (
                <button 
                  type="button"
                  id="remove-selected-file"
                  onClick={handleCancel}
                  aria-label="Remove specimen"
                  className="text-[#D6C7C2] hover:text-[#FAF5F6] p-1.5 hover:bg-[#2C2129] rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Progress Meter */}
        {(uploading || progress > 0) && (
          <div className="space-y-2 font-mono">
            <div className="flex justify-between text-xs font-bold text-[#D6C7C2]">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C89D66] animate-pulse" />
                <span>PROCESSING & PROFILING DATASET...</span>
              </span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-[#141013] rounded-full h-2.5 overflow-hidden border border-[#382A34]">
              <div 
                className="bg-gradient-to-r from-[#C89D66] to-[#E08D9D] h-full transition-all duration-150 rounded-full" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Custody Status Alerts */}
        {status !== 'idle' && (
          <div className={`p-4 rounded-xl font-mono text-xs border ${
            status === 'success' 
              ? 'bg-[#5FA788]/15 text-[#88D4B4] border-[#5FA788]/40' 
              : 'bg-[#D96B60]/15 text-[#F2988F] border-[#D96B60]/40'
          }`}>
            <div className="flex items-start gap-3">
              {status === 'success' ? (
                <FileCheck2 className="w-5 h-5 shrink-0 text-[#88D4B4]" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 text-[#F2988F]" />
              )}
              <div className="space-y-1">
                <p className="font-bold uppercase tracking-wider">
                  {status === 'success' ? 'DATASET PROFILED SUCCESSFULLY' : 'INGESTION FAILED'}
                </p>
                <p className="text-[11px] text-[#D6C7C2] font-body">{message}</p>
                
                {status === 'success' && uploadedDatasetId && (
                  <div className="pt-3">
                    <Link 
                      href={`/datasets/${uploadedDatasetId}`}
                      className="btn-primary text-xs inline-flex items-center gap-2"
                    >
                      <span>Open Dataset Overview</span>
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
          <div className="flex items-center gap-3 justify-end pt-2 border-t border-[#382A34]">
            <button
              type="button"
              id="cancel-upload-btn"
              disabled={uploading}
              onClick={handleCancel}
              className="btn-secondary text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              id="submit-upload-btn"
              disabled={uploading}
              onClick={handleUpload}
              className="btn-primary text-xs flex items-center gap-2 cursor-pointer"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Dataset...</span>
                </>
              ) : (
                <>
                  <FolderArchive className="w-3.5 h-3.5" />
                  <span>Upload & Profile Dataset</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Disclaimers */}
      <div className="p-4 rounded-xl bg-[#181216] border border-[#382A34] font-mono text-[11px] text-[#D6C7C2] space-y-1">
        <div className="text-[#FAF5F6] font-bold uppercase flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#C89D66]" />
          <span>Storage & Data Integrity Policy</span>
        </div>
        <p className="font-body text-[#D6C7C2] text-xs">
          Files are immutable once ingested. The system calculates checksum hashes to prevent unauthorized modifications during downstream profiling and ML training passes.
        </p>
      </div>
    </div>
  );
}
