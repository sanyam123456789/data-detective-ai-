'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Database, 
  Activity, 
  CheckCircle2, 
  HardDrive, 
  ArrowUpRight, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  Eye, 
  Layers, 
  ShieldAlert,
  FileSpreadsheet,
  FileCode,
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
  total_rows?: number;
  total_columns?: number;
  health_score?: number;
  total_missing_values?: number;
  total_duplicate_rows?: number;
  memory_usage_bytes?: number;
  total_outliers?: number;
}

export default function Dashboard() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const { data: datasets, isLoading, refetch, isFetching } = useQuery<Dataset[]>({
    queryKey: ['datasets'],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/api/v1/datasets`);
      if (!res.ok) {
        throw new Error('Failed to fetch datasets');
      }
      return res.json();
    },
  });

  const formatBytes = (bytes: number | null | undefined) => {
    if (bytes === null || bytes === undefined) return '-';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateVal: string) => {
    try {
      if (!dateVal) return '-';
      return new Date(dateVal).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateVal;
    }
  };

  const formatNumberSafe = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return '-';
    return val.toLocaleString();
  };

  const totalDatasets = datasets?.length || 0;
  const hasProfiles = datasets?.some(item => item.health_score !== null && item.health_score !== undefined) ?? false;

  const totalRows = hasProfiles ? datasets?.reduce((sum, item) => sum + (item.total_rows ?? 0), 0) ?? 0 : null;
  const totalColumns = hasProfiles ? datasets?.reduce((sum, item) => sum + (item.total_columns ?? 0), 0) ?? 0 : null;
  
  const totalHealth = hasProfiles ? datasets?.reduce((sum, item) => sum + (item.health_score ?? 0), 0) ?? 0 : null;
  const profiledCount = datasets?.filter(item => item.health_score !== null && item.health_score !== undefined).length || 0;
  const avgHealthScore = profiledCount > 0 && totalHealth !== null ? (totalHealth / profiledCount).toFixed(1) + '%' : '-';
  
  const totalMissing = hasProfiles ? datasets?.reduce((sum, item) => sum + (item.total_missing_values ?? 0), 0) ?? 0 : null;
  const totalDuplicates = hasProfiles ? datasets?.reduce((sum, item) => sum + (item.total_duplicate_rows ?? 0), 0) ?? 0 : null;
  const totalMemoryBytes = hasProfiles ? datasets?.reduce((sum, item) => sum + (item.memory_usage_bytes ?? 0), 0) ?? 0 : null;
  const totalOutliers = hasProfiles ? datasets?.reduce((sum, item) => sum + (item.total_outliers ?? 0), 0) ?? 0 : null;

  const forensicKpis = [
    {
      label: 'AVERAGE INTEGRITY VERDICT',
      value: avgHealthScore,
      meta: 'Across all verified profiles',
      stamp: 'HEALTH',
      stampType: 'stamp-tag-emerald',
      icon: CheckCircle2,
    },
    {
      label: 'TOTAL ROWS AUDITED',
      value: formatNumberSafe(totalRows),
      meta: 'Ingested data coordinates',
      stamp: 'RECORDS',
      stampType: 'stamp-tag-cyan',
      icon: Activity,
    },
    {
      label: 'SCHEMAS DISSECTED',
      value: formatNumberSafe(totalColumns),
      meta: 'Distinct column profiles',
      stamp: 'SCHEMA',
      stampType: 'stamp-tag-muted',
      icon: Database,
    },
    {
      label: 'MEMORY ALLOCATION',
      value: formatBytes(totalMemoryBytes),
      meta: 'Active RAM footprint',
      stamp: 'FOOTPRINT',
      stampType: 'stamp-tag-muted',
      icon: HardDrive,
    },
    {
      label: 'NULL VALUES FLAGGED',
      value: formatNumberSafe(totalMissing),
      meta: 'Missing cell anomalies',
      stamp: 'MISSING',
      stampType: 'stamp-tag-amber',
      icon: Layers,
    },
    {
      label: 'DUPLICATE ENTRIES',
      value: formatNumberSafe(totalDuplicates),
      meta: 'Identical row signatures',
      stamp: 'DUPLICATES',
      stampType: 'stamp-tag-amber',
      icon: FileSpreadsheet,
    },
    {
      label: 'STATISTICAL OUTLIERS',
      value: formatNumberSafe(totalOutliers),
      meta: 'IQR boundary infractions',
      stamp: 'ANOMALY',
      stampType: 'stamp-tag-crimson',
      icon: ShieldAlert,
    },
  ];

  const recentDatasetsList = datasets?.slice(0, 6) || [];

  return (
    <div className="space-y-8">
      {/* Investigation Board Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ruling pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="stamp-tag stamp-tag-amber">FORENSIC LEDGER</span>
            <span className="text-xs font-mono text-paper-400">BOARD REF: #INV-CENTRAL-01</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-paper-50">
            Investigation Board
          </h1>
          <p className="text-xs font-mono text-paper-400 mt-1">
            REAL-TIME METRICS & ACTIVE EVIDENCE DOSSIERS
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="refresh-dashboard-btn"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="btn-secondary text-xs"
            title="Refresh Forensic Registry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh Ledger</span>
          </button>
          
          <Link 
            id="upload-dataset-dashboard-btn"
            href="/upload"
            className="btn-primary text-xs"
          >
            <span>Intake New Case</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Forensic KPI Metric Tiles */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {forensicKpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="ledger-card p-4 flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between gap-2 border-b border-ruling pb-2">
                <span className="text-[10px] font-mono text-paper-400 font-bold uppercase tracking-wider truncate">
                  {kpi.label}
                </span>
                <span className={`stamp-tag ${kpi.stampType} text-[9px]`}>
                  {kpi.stamp}
                </span>
              </div>

              <div>
                <div className="text-2xl font-mono font-bold text-paper-50">
                  {kpi.value}
                </div>
                <div className="text-[10px] font-mono text-paper-400 mt-0.5">
                  {kpi.meta}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Main Ledger Table & Forensic Audit Feed */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table: Active Evidence Dossiers */}
        <div className="lg:col-span-2 ledger-card">
          <div className="ledger-header flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FolderOpen className="w-3.5 h-3.5 text-evidence-amber" />
              <span>Active Case Dossiers ({totalDatasets})</span>
            </span>
            <span className="text-[10px] text-paper-400">CHRONOLOGICAL AUDIT</span>
          </div>

          <div className="overflow-x-auto w-full">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-xs font-mono text-paper-400">
                <RefreshCw className="w-4 h-4 animate-spin text-evidence-amber" />
                <span>Extracting case files from vault...</span>
              </div>
            ) : recentDatasetsList.length === 0 ? (
              <div className="p-8 text-center space-y-3 font-mono">
                <div className="w-10 h-10 rounded bg-ink-800 border border-ruling mx-auto flex items-center justify-center text-paper-400">
                  <Database className="w-5 h-5" />
                </div>
                <p className="text-xs text-paper-300 font-bold">No active cases registered in ledger</p>
                <p className="text-[11px] text-paper-400 max-w-xs mx-auto">
                  Submit a dataset to initialize automated profiling and anomaly detection.
                </p>
                <Link href="/upload" className="btn-primary text-xs inline-flex mt-2">
                  Open Case File
                </Link>
              </div>
            ) : (
              <table className="forensic-table">
                <thead>
                  <tr>
                    <th>Case Docket / File</th>
                    <th>Coordinates</th>
                    <th>Integrity Score</th>
                    <th>Custody</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDatasetsList.map((row) => {
                    const health = row.health_score ?? null;
                    let stampClass = 'stamp-tag-muted';
                    let stampLabel = 'UNPROFILED';
                    if (health !== null) {
                      if (health >= 85) {
                        stampClass = 'stamp-tag-emerald';
                        stampLabel = `${health}% VERIFIED`;
                      } else if (health >= 60) {
                        stampClass = 'stamp-tag-amber';
                        stampLabel = `${health}% FLAGGED`;
                      } else {
                        stampClass = 'stamp-tag-crimson';
                        stampLabel = `${health}% CRITICAL`;
                      }
                    }

                    return (
                      <tr key={row.id}>
                        <td>
                          <div className="font-mono text-xs font-bold text-paper-100 truncate max-w-[200px]" title={row.original_filename}>
                            {row.original_filename}
                          </div>
                          <div className="text-[10px] font-mono text-paper-400 mt-0.5">
                            TAG: #{row.id.slice(0, 8)} • {formatDate(row.created_at)}
                          </div>
                        </td>
                        <td className="font-mono text-xs text-paper-300">
                          {row.total_rows !== null && row.total_rows !== undefined && row.total_columns !== null && row.total_columns !== undefined ? (
                            `${formatNumberSafe(row.total_rows)}R × ${formatNumberSafe(row.total_columns)}C`
                          ) : (
                            <span className="text-paper-400">-</span>
                          )}
                        </td>
                        <td>
                          <span className={`stamp-tag ${stampClass} text-[9px]`}>
                            {stampLabel}
                          </span>
                        </td>
                        <td>
                          <span className="font-mono text-[10px] text-paper-400 bg-ink-950 px-2 py-0.5 rounded border border-ruling">
                            {row.storage_type}
                          </span>
                        </td>
                        <td>
                          <Link 
                            href={`/datasets/${row.id}`}
                            className="btn-secondary text-[11px] py-1 px-2.5"
                            title="Inspect Case Dossier"
                          >
                            <Eye className="w-3.5 h-3.5 text-evidence-amber" />
                            <span>Inspect</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Forensic Intelligence Bulletins */}
        <div className="ledger-card space-y-4">
          <div className="ledger-header flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-evidence-crimson" />
              <span>Forensic Advisories</span>
            </span>
            <span className="stamp-tag stamp-tag-amber text-[9px]">LIVE INTEL</span>
          </div>

          <div className="p-4 space-y-3 font-mono text-xs">
            <div className="p-3 bg-ink-850 rounded border border-ruling space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-evidence-amber font-bold">
                <span>[ADVISORY #01] STATISTICAL QUARANTINE</span>
                <span>IQR LEVEL 1.5</span>
              </div>
              <p className="text-[11px] text-paper-300 font-body leading-relaxed">
                Outliers are flagged when numeric distributions exceed 1.5× Interquartile Range thresholds. Review anomaly registers inside each dossier.
              </p>
            </div>

            <div className="p-3 bg-ink-850 rounded border border-ruling space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-evidence-cyan font-bold">
                <span>[ADVISORY #02] CODE STUDIO READY</span>
                <span>SQL / PYSPARK</span>
              </div>
              <p className="text-[11px] text-paper-300 font-body leading-relaxed">
                Automated pipeline scripts can be exported directly from the Code Studio tab once schema integrity audits are concluded.
              </p>
            </div>

            <div className="p-3 bg-ink-850 rounded border border-ruling space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-evidence-emerald font-bold">
                <span>[ADVISORY #03] CHAIN OF CUSTODY</span>
                <span>SHA-256</span>
              </div>
              <p className="text-[11px] text-paper-300 font-body leading-relaxed">
                Uploaded files are stored immutably. Local or AWS S3 lakehouse partitions maintain full audit traceability.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
