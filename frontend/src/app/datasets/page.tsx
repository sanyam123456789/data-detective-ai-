'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Database, 
  HardDrive, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  FolderArchive,
  ArrowRight,
  FolderOpen
} from 'lucide-react';
import Link from 'next/link';

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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: datasets, isLoading, error, refetch, isFetching } = useQuery<Dataset[]>({
    queryKey: ['datasets'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/api/v1/datasets`);
      if (!res.ok) {
        throw new Error('Failed to retrieve datasets catalog');
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
    if (!isMounted || !dateVal) return '-';
    try {
      if (typeof dateVal === 'number') {
        const d = new Date(dateVal * 1000);
        return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
      }
      const d = new Date(dateVal);
      return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return String(dateVal);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#382A34] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="stamp-tag stamp-tag-amber">DATA CATALOG</span>
            <span className="text-xs font-mono text-[#D6C7C2] font-medium">LIBRARY & PROFILES</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#FAF5F6]">
            Dataset Catalog & Library
          </h1>
          <p className="text-xs font-mono text-[#D6C7C2] mt-1">
            EXPLORE, INSPECT, AND AUDIT INGESTED TABLES & AWS S3 PARQUET LAKEHOUSES
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            id="refresh-datasets-btn"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="btn-secondary text-xs flex items-center gap-1.5 cursor-pointer"
            title="Refresh Datasets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <Link
            id="add-dataset-datasets-btn"
            href="/upload"
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Dataset</span>
          </Link>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 font-mono text-xs text-[#D6C7C2]">
          <RefreshCw className="w-6 h-6 text-[#C89D66] animate-spin" />
          <span>LOADING DATASET CATALOG...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-[#D96B60]/15 text-[#F2988F] border border-[#D96B60]/40 font-mono text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-[#D96B60] mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold uppercase tracking-wider text-[#FAF5F6]">FAILED TO RETRIEVE DATASETS</p>
            <p className="text-[#D6C7C2] font-sans">
              Ensure the backend FastAPI server is running at <code className="text-[#C89D66] font-bold">{apiUrl}</code>.
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!datasets || datasets.length === 0) && (
        <div className="ledger-card p-12 text-center flex flex-col items-center justify-center gap-4 font-mono">
          <div className="w-12 h-12 rounded-xl bg-[#261E24] border border-[#382A34] flex items-center justify-center text-[#D6C7C2]">
            <FolderArchive className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#FAF5F6] uppercase">Dataset Catalog is Empty</h3>
            <p className="text-xs text-[#D6C7C2] font-sans max-w-sm mx-auto">
              No datasets have been uploaded yet. Upload a CSV or Excel file to begin automated profiling and quality audits.
            </p>
          </div>
          <Link
            href="/upload"
            className="btn-primary text-xs mt-2 flex items-center gap-1.5"
          >
            <span>Upload First Dataset</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Grid of Dataset Cards */}
      {!isLoading && !error && datasets && datasets.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datasets.map((dataset, i) => (
            <div
              key={dataset.id}
              className="ledger-card p-5 flex flex-col justify-between gap-5 group hover:border-[#C89D66]/60"
            >
              <div className="space-y-3.5">
                {/* Card Header */}
                <div className="flex items-center justify-between gap-3 border-b border-[#382A34] pb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#261E24] border border-[#382A34] flex items-center justify-center text-[#C89D66] shrink-0 font-mono text-xs font-bold">
                    #{String(i + 1).padStart(2, '0')}
                  </div>
                  <span className="stamp-tag stamp-tag-cyan text-[10px]">
                    <HardDrive className="w-3 h-3 text-[#E08D9D]" />
                    <span>{dataset.storage_type}</span>
                  </span>
                </div>

                {/* File Details */}
                <div>
                  <h3 className="font-mono text-xs font-bold text-[#FAF5F6] truncate group-hover:text-[#C89D66] transition-colors" title={dataset.original_filename}>
                    {dataset.original_filename}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#D6C7C2] mt-1">
                    <span>SIZE: {formatBytes(dataset.file_size)}</span>
                    <span>•</span>
                    <span>EXT: {dataset.file_extension || 'CSV'}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-[#382A34] flex items-center justify-between gap-2 font-mono">
                <span className="text-[10px] text-[#D6C7C2]">
                  {formatDate(dataset.created_at)}
                </span>
                
                <div className="flex items-center gap-2">
                  <Link 
                    href={`/datasets/${dataset.id}`}
                    className="btn-primary text-[11px] py-1 px-3 flex items-center gap-1.5 cursor-pointer"
                    title="Open Dataset Profiler"
                  >
                    <FolderOpen className="w-3 h-3" />
                    <span>Inspect</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
