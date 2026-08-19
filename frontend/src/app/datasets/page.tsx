'use client';

import { useQuery } from '@tanstack/react-query';
import { 
  Database, 
  FileSpreadsheet, 
  HardDrive, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  Trash2, 
  Eye, 
  FolderArchive,
  ArrowRight,
  FolderOpen
} from 'lucide-react';
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
        throw new Error('Failed to retrieve case archives');
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
        return new Date(dateVal * 1000).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      return new Date(dateVal).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateVal);
    }
  };

  return (
    <div className="space-y-8">
      {/* Vault Header Docket */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ruling pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="stamp-tag stamp-tag-amber">EVIDENCE VAULT</span>
            <span className="text-xs font-mono text-paper-400">ARCHIVE REF: #VAULT-SEC-03</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-paper-50">
            Case Archives & Evidence Vault
          </h1>
          <p className="text-xs font-mono text-paper-400 mt-1">
            INSPECT, MANAGE, AND AUDIT INGESTED DATA DOSSIERS
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="refresh-datasets-btn"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="btn-secondary text-xs"
            title="Refresh Evidence Vault"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh Vault</span>
          </button>
          
          <Link
            id="add-dataset-datasets-btn"
            href="/upload"
            className="btn-primary text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ingest Specimen</span>
          </Link>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 font-mono text-xs text-paper-400">
          <RefreshCw className="w-6 h-6 text-evidence-amber animate-spin" />
          <span>ACCESSING ENCRYPTED EVIDENCE VAULT...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded bg-ink-950 text-evidence-crimson border border-evidence-crimson/40 font-mono text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-evidence-crimson mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold uppercase tracking-wider">FAILED TO RETRIEVE EVIDENCE ARCHIVES</p>
            <p className="text-paper-300 font-body">
              Ensure the backend FastAPI forensic server is reachable at <code className="text-evidence-amber">{apiUrl}</code>.
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && (!datasets || datasets.length === 0) && (
        <div className="ledger-card p-12 text-center flex flex-col items-center justify-center gap-4 font-mono">
          <div className="w-12 h-12 rounded bg-ink-800 border border-ruling flex items-center justify-center text-evidence-amber">
            <FolderArchive className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-paper-100 uppercase">Evidence Vault is Currently Empty</h3>
            <p className="text-xs text-paper-400 font-body max-w-sm mx-auto">
              No data specimens have been filed into the archive. Ingest your first CSV or Excel file to begin automated forensic profiling.
            </p>
          </div>
          <Link
            href="/upload"
            className="btn-primary text-xs mt-2"
          >
            <span>Open First Case Intake</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Grid of Case Dossier Cards */}
      {!isLoading && !error && datasets && datasets.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datasets.map((dataset, i) => (
            <div
              key={dataset.id}
              className="ledger-card p-5 flex flex-col justify-between gap-5 group"
            >
              <div className="space-y-3.5">
                {/* Dossier Card Header */}
                <div className="flex items-center justify-between gap-3 border-b border-ruling pb-3">
                  <div className="w-8 h-8 rounded bg-ink-850 border border-ruling flex items-center justify-center text-evidence-amber shrink-0 font-mono text-xs font-bold">
                    #{String(i + 1).padStart(2, '0')}
                  </div>
                  <span className="stamp-tag stamp-tag-muted text-[10px]">
                    <HardDrive className="w-3 h-3 text-evidence-cyan" />
                    <span>{dataset.storage_type}</span>
                  </span>
                </div>

                {/* File Details */}
                <div>
                  <h3 className="font-mono text-xs font-bold text-paper-100 truncate group-hover:text-evidence-amber transition-colors" title={dataset.original_filename}>
                    {dataset.original_filename}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-paper-400 mt-1">
                    <span>SIZE: {formatBytes(dataset.file_size)}</span>
                    <span>•</span>
                    <span>EXT: {dataset.file_extension || 'CSV'}</span>
                  </div>
                </div>
              </div>

              {/* Dossier Footer Actions */}
              <div className="pt-3 border-t border-ruling flex items-center justify-between gap-2 font-mono">
                <span className="text-[10px] text-paper-400">
                  {formatDate(dataset.created_at)}
                </span>
                
                <div className="flex items-center gap-2">
                  <Link 
                    href={`/datasets/${dataset.id}`}
                    className="btn-primary text-[11px] py-1 px-3"
                    title="Open Case Dossier"
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
