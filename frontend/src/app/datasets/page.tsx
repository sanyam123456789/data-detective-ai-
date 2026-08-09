'use client';

import { useQuery } from '@tanstack/react-query';
import { Database, FileSpreadsheet, HardDrive, Plus, RefreshCw, AlertCircle, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Dataset {
  id: string;
  original_filename: string;
  stored_filename: string;
  storage_type: string;
  file_size: number;
  file_extension: string;
  mime_type: string;
  storage_path: string;
  upload_status: string;
  created_at: string;
  updated_at: string;
}

export default function DatasetsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const { data: datasets, isLoading, error, refetch, isFetching } = useQuery<Dataset[]>({
    queryKey: ['datasets'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/api/v1/datasets`);
      if (!res.ok) {
        throw new Error('Failed to fetch datasets list');
      }
      return res.json();
    },
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateVal: string | number) => {
    try {
      if (!dateVal) return '-';
      if (typeof dateVal === 'number') {
        return new Date(dateVal * 1000).toLocaleString();
      }
      return new Date(dateVal).toLocaleString();
    } catch {
      return String(dateVal);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Ingested Datasets</h1>
          <p className="text-gray-400 text-sm mt-1">Manage and profile your uploaded data sources.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="refresh-datasets-btn"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 rounded-lg text-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4.5 h-4.5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <Link
            id="add-dataset-datasets-btn"
            href="/upload"
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition-all hover:scale-105 shadow-md flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Dataset</span>
          </Link>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
          <p className="text-sm text-gray-400">Loading datasets list...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-5 rounded-lg bg-red-500/5 text-red-300 border border-red-500/10 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <div className="space-y-1 text-xs">
            <p className="font-bold">Failed to load datasets</p>
            <p className="text-gray-400">Please make sure the backend server is running. (Error: {(error as any).message})</p>
          </div>
        </div>
      )}

      {/* Success empty list */}
      {!isLoading && !error && (!datasets || datasets.length === 0) && (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center text-gray-400">
            <Database className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-md font-bold text-white">No datasets uploaded yet</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              Get started by uploading your first CSV or Excel file. We will process and index it instantly.
            </p>
          </div>
          <Link
            href="/upload"
            className="mt-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition-all"
          >
            Upload Now
          </Link>
        </div>
      )}

      {/* Datasets list */}
      {!isLoading && !error && datasets && datasets.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datasets.map((dataset, i) => (
            <motion.div
              key={dataset.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card p-6 flex flex-col justify-between gap-5"
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                    <FileSpreadsheet className="w-5.5 h-5.5" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-white/5 text-gray-400 border border-white/5">
                    <HardDrive className="w-3 h-3 text-violet-400" />
                    <span>{dataset.storage_type}</span>
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white truncate hover:text-clip" title={dataset.original_filename}>
                    {dataset.original_filename}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">{formatBytes(dataset.file_size)}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2">
                <span className="text-[10px] text-gray-500 font-medium">
                  {formatDate(dataset.created_at)}
                </span>
                <div className="flex gap-2">
                  <Link 
                    href={`/datasets/${dataset.id}`}
                    title="View profiling details"
                    className="p-1.5 bg-white/5 border border-white/5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button 
                    title="Delete (disabled in Phase 1)"
                    disabled
                    className="p-1.5 bg-white/5 border border-white/5 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-50 cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </section>
      )}
    </div>
  );
}
