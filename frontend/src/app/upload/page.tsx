'use client';

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileSpreadsheet, X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

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
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setStatus('idle');
    setProgress(10);

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
        throw new Error(errorData.detail || 'Failed to upload dataset.');
      }

      const data = await response.json();
      setProgress(100);
      setStatus('success');
      setMessage(`Successfully uploaded "${data.original_filename}" to storage.`);
    } catch (err: any) {
      clearInterval(progressInterval);
      setStatus('error');
      setMessage(err.message || 'An unexpected error occurred during upload.');
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
    <div className="max-w-2xl mx-auto space-y-8 py-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Upload Dataset</h1>
        <p className="text-gray-400 text-sm">
          Select or drag and drop a CSV or Excel spreadsheet to upload.
        </p>
      </div>

      <div className="glass-card p-8 space-y-6">
        {/* Dropzone */}
        {!file && (
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 ${
              isDragActive 
                ? 'border-violet-500 bg-violet-500/5' 
                : 'border-white/10 hover:border-violet-500/50 hover:bg-white/[0.01]'
            }`}
          >
            <input {...getInputProps()} id="dataset-file-input" />
            <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-gray-400">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">Drag & drop your file here</p>
              <p className="text-xs text-gray-400">or click to browse from files</p>
            </div>
            <div className="text-[11px] text-gray-500 font-medium">
              Accepts CSV (.csv) and Excel (.xlsx, .xls) files up to 50MB
            </div>
          </div>
        )}

        {/* Selected File Card */}
        {file && (
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{file.name}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">{formatBytes(file.size)}</p>
                </div>
              </div>

              {!uploading && status === 'idle' && (
                <button 
                  id="remove-selected-file"
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Progress Bar */}
        {(uploading || progress > 0) && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-gray-400">
              <span>Uploading dataset...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-violet-600 h-full rounded-full transition-all duration-150" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Status Alert */}
        {status !== 'idle' && (
          <div className={`p-4 rounded-lg flex gap-3 text-xs leading-relaxed border ${
            status === 'success' 
              ? 'bg-emerald-500/5 text-emerald-300 border-emerald-500/10' 
              : 'bg-red-500/5 text-red-300 border-red-500/10'
          }`}>
            {status === 'success' ? (
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400 animate-bounce" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            )}
            <div className="space-y-1">
              <p className="font-bold">{status === 'success' ? 'Upload Succeeded' : 'Upload Failed'}</p>
              <p className="text-gray-400">{message}</p>
            </div>
          </div>
        )}

        {/* Actions Button Bar */}
        {file && (
          <div className="flex items-center gap-3 justify-end pt-2">
            <button
              id="cancel-upload-btn"
              disabled={uploading}
              onClick={handleCancel}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              id="submit-upload-btn"
              disabled={uploading || status === 'success'}
              onClick={handleUpload}
              className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <span>Upload Dataset</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
