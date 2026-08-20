'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Database, 
  Activity, 
  CheckCircle2, 
  HardDrive, 
  ArrowUpRight, 
  RefreshCw, 
  Eye, 
  Layers, 
  ShieldAlert,
  FileSpreadsheet,
  FolderOpen,
  Brain,
  Terminal,
  Cloud,
  Sparkles,
  HelpCircle
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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    if (!isMounted || !dateVal) return '-';
    try {
      const d = new Date(dateVal);
      return `${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
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
      label: 'DATA QUALITY HEALTH',
      value: avgHealthScore,
      meta: 'Across all profiled tables',
      stamp: 'QUALITY',
      stampType: 'stamp-tag-emerald',
      icon: CheckCircle2,
    },
    {
      label: 'TOTAL ROWS AUDITED',
      value: formatNumberSafe(totalRows),
      meta: 'Total ingested records',
      stamp: 'RECORDS',
      stampType: 'stamp-tag-cyan',
      icon: Activity,
    },
    {
      label: 'COLUMNS PROFILED',
      value: formatNumberSafe(totalColumns),
      meta: 'Distinct schema fields',
      stamp: 'SCHEMA',
      stampType: 'stamp-tag-muted',
      icon: Database,
    },
    {
      label: 'MEMORY FOOTPRINT',
      value: formatBytes(totalMemoryBytes),
      meta: 'Active RAM partition',
      stamp: 'FOOTPRINT',
      stampType: 'stamp-tag-muted',
      icon: HardDrive,
    },
    {
      label: 'MISSING NULL CELLS',
      value: formatNumberSafe(totalMissing),
      meta: 'Null values flagged',
      stamp: 'NULLS',
      stampType: 'stamp-tag-amber',
      icon: Layers,
    },
    {
      label: 'DUPLICATE ROWS',
      value: formatNumberSafe(totalDuplicates),
      meta: 'Identical row signatures',
      stamp: 'DUPLICATES',
      stampType: 'stamp-tag-amber',
      icon: FileSpreadsheet,
    },
    {
      label: 'STATISTICAL OUTLIERS',
      value: formatNumberSafe(totalOutliers),
      meta: 'IQR & Z-Score boundary violations',
      stamp: 'OUTLIERS',
      stampType: 'stamp-tag-crimson',
      icon: ShieldAlert,
    },
  ];

  const featureGuides = [
    {
      title: '01. Automated Data Profiler',
      desc: 'Upload CSV or Excel. Immediately computes min/max/mean, null rates, and detects data types with zero configuration.',
      badge: 'PROFILER',
      icon: Database,
      color: 'text-[#C89D66]',
    },
    {
      title: '02. Data Quality & Detective Engine',
      desc: 'Audits Completeness, Validity, Uniqueness, and Consistency with IQR (1.5x IQR) and Z-Score outlier detection.',
      badge: 'QUALITY ENGINE',
      icon: ShieldAlert,
      color: 'text-[#E08D9D]',
    },
    {
      title: '03. AI Intelligence & Recommendations',
      desc: 'Gemini 2.0 synthesizes executive summaries, data quality risk assessments, and interactive natural-language chat.',
      badge: 'AI COPILOT',
      icon: Brain,
      color: 'text-[#D4A373]',
    },
    {
      title: '04. SQL & PySpark Code Studio',
      desc: 'Generates production-grade data cleansing queries (DuckDB/Postgres) and distributed PySpark ETL pipeline scripts.',
      badge: 'CODE STUDIO',
      icon: Terminal,
      color: 'text-[#5FA788]',
    },
    {
      title: '05. AWS S3 & Athena Lakehouse',
      desc: 'Stores datasets in S3, registers schemas in AWS Glue Data Catalog, and runs real-time Amazon Athena SQL queries.',
      badge: 'LAKEHOUSE',
      icon: Cloud,
      color: 'text-[#E08D9D]',
    },
    {
      title: '06. Autonomous AI Analyst',
      desc: 'Ask business questions in plain English. AI writes & executes Athena SQL, fetches results, and synthesizes root-cause insights.',
      badge: 'AI ANALYST',
      icon: Sparkles,
      color: 'text-[#C89D66]',
    },
  ];

  const recentDatasetsList = datasets?.slice(0, 6) || [];

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#382A34] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="stamp-tag stamp-tag-amber">SYSTEM OVERVIEW</span>
            <span className="text-xs font-mono text-[#D6C7C2]">STATUS: LIVE TELEMETRY</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#FAF5F6]">
            Data Quality & Lakehouse Dashboard
          </h1>
          <p className="text-xs font-mono text-[#D6C7C2] mt-1">
            REAL-TIME DATASET METRICS, QUALITY HEALTH GRADES, AND ACTIVE LAKEHOUSE CATALOGS
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            id="refresh-dashboard-btn"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="btn-secondary text-xs flex items-center gap-1.5 cursor-pointer"
            title="Refresh Registry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <Link 
            id="upload-dataset-dashboard-btn"
            href="/upload"
            className="btn-primary text-xs flex items-center gap-1.5"
          >
            <span>Upload Dataset</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {forensicKpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="ledger-card p-4 flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between gap-2 border-b border-[#382A34] pb-2">
                <span className="text-[10px] font-mono text-[#D6C7C2] font-bold uppercase tracking-wider truncate">
                  {kpi.label}
                </span>
                <span className={`stamp-tag ${kpi.stampType} text-[9px]`}>
                  {kpi.stamp}
                </span>
              </div>

              <div>
                <div className="text-2xl font-mono font-bold text-[#FAF5F6]">
                  {kpi.value}
                </div>
                <div className="text-[10px] font-mono text-[#D6C7C2] mt-0.5">
                  {kpi.meta}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Main Table + Feature Quick Guide Column */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table: Active Datasets */}
        <div className="lg:col-span-2 ledger-card overflow-hidden">
          <div className="ledger-header flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FolderOpen className="w-3.5 h-3.5 text-[#C89D66]" />
              <span className="text-[#FAF5F6] font-bold">Active Datasets ({totalDatasets})</span>
            </span>
            <span className="text-[10px] text-[#D6C7C2] font-normal">CHRONOLOGICAL LIST</span>
          </div>

          <div className="overflow-x-auto w-full">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-xs font-mono text-[#D6C7C2]">
                <RefreshCw className="w-4 h-4 animate-spin text-[#C89D66]" />
                <span>Loading datasets from catalog...</span>
              </div>
            ) : recentDatasetsList.length === 0 ? (
              <div className="p-8 text-center space-y-3 font-mono">
                <div className="w-10 h-10 rounded-xl bg-[#261E24] border border-[#382A34] mx-auto flex items-center justify-center text-[#D6C7C2]">
                  <Database className="w-5 h-5" />
                </div>
                <p className="text-xs text-[#FAF5F6] font-bold">No datasets uploaded yet</p>
                <p className="text-[11px] text-[#D6C7C2] max-w-xs mx-auto">
                  Upload a CSV or Excel file to begin automated profiling, quality audits, and AI analysis.
                </p>
                <Link href="/upload" className="btn-primary text-xs inline-flex mt-2">
                  Upload First Dataset
                </Link>
              </div>
            ) : (
              <table className="forensic-table">
                <thead>
                  <tr>
                    <th>Dataset Name</th>
                    <th>Rows & Columns</th>
                    <th>Quality Score</th>
                    <th>Storage</th>
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
                          <div className="font-mono text-xs font-bold text-[#FAF5F6] truncate max-w-[200px]" title={row.original_filename}>
                            {row.original_filename}
                          </div>
                          <div className="text-[10px] font-mono text-[#D6C7C2] mt-0.5">
                            ID: #{row.id.slice(0, 8)} • {formatDate(row.created_at)}
                          </div>
                        </td>
                        <td className="font-mono text-xs text-[#D6C7C2]">
                          {row.total_rows !== null && row.total_rows !== undefined && row.total_columns !== null && row.total_columns !== undefined ? (
                            `${formatNumberSafe(row.total_rows)} rows × ${formatNumberSafe(row.total_columns)} cols`
                          ) : (
                            <span className="text-[#9E8B95]">-</span>
                          )}
                        </td>
                        <td>
                          <span className={`stamp-tag ${stampClass} text-[9px]`}>
                            {stampLabel}
                          </span>
                        </td>
                        <td>
                          <span className="font-mono text-[10px] text-[#F7B7C4] bg-[#E08D9D]/15 px-2 py-0.5 rounded border border-[#E08D9D]/30">
                            {row.storage_type}
                          </span>
                        </td>
                        <td>
                          <Link 
                            href={`/datasets/${row.id}`}
                            className="btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1.5 cursor-pointer"
                            title="Inspect Dataset Details"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#C89D66]" />
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

        {/* Feature Navigation & Tool Guide Column */}
        <div className="ledger-card space-y-4">
          <div className="ledger-header flex items-center justify-between">
            <span className="flex items-center gap-2 text-[#FAF5F6] font-bold">
              <HelpCircle className="w-3.5 h-3.5 text-[#C89D66]" />
              <span>Platform Feature Guide</span>
            </span>
            <span className="stamp-tag stamp-tag-amber text-[9px]">TOOLS DIRECTORY</span>
          </div>

          <div className="p-4 space-y-3 font-mono text-xs max-h-[480px] overflow-y-auto">
            {featureGuides.map((guide, i) => {
              const Icon = guide.icon;
              return (
                <div key={i} className="p-3 bg-[#181216] rounded-lg border border-[#382A34] space-y-1.5 hover:border-[#4E3B49] transition-colors">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="flex items-center gap-1.5 text-[#FAF5F6]">
                      <Icon className={`w-3.5 h-3.5 ${guide.color}`} />
                      <span>{guide.title}</span>
                    </span>
                    <span className="stamp-tag stamp-tag-muted text-[8px]">{guide.badge}</span>
                  </div>
                  <p className="text-[11px] text-[#D6C7C2] font-sans leading-relaxed">
                    {guide.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
