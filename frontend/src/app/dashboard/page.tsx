'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Database, Activity, CheckCircle, HardDrive, ArrowUpRight, TrendingUp, AlertTriangle, RefreshCw, Eye, Percent, Layers, ShieldAlert } from 'lucide-react';
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
      return new Date(dateVal).toLocaleString();
    } catch {
      return dateVal;
    }
  };

  const formatNumberSafe = (val: number | null | undefined): string => {
    if (val === null || val === undefined) return '-';
    return val.toLocaleString();
  };

  // Aggregated data calculations
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

  const cards = [
    {
      title: 'Health Score (Avg)',
      value: avgHealthScore,
      change: 'Calculated across profiles',
      icon: CheckCircle,
      color: 'text-emerald-400',
    },
    {
      title: 'Rows Processed',
      value: formatNumberSafe(totalRows),
      change: 'Total ingested data rows',
      icon: Activity,
      color: 'text-indigo-400',
    },
    {
      title: 'Columns Ingested',
      value: formatNumberSafe(totalColumns),
      change: 'Total schemas mapped',
      icon: Database,
      color: 'text-violet-400',
    },
    {
      title: 'Memory Footprint',
      value: formatBytes(totalMemoryBytes),
      change: 'Processed RAM footprint',
      icon: HardDrive,
      color: 'text-amber-400',
    },
    {
      title: 'Missing Values (Cells)',
      value: formatNumberSafe(totalMissing),
      change: 'Null values count',
      icon: Layers,
      color: 'text-pink-400',
    },
    {
      title: 'Duplicate Rows',
      value: formatNumberSafe(totalDuplicates),
      change: 'Non-unique row entries',
      icon: Percent,
      color: 'text-blue-400',
    },
    {
      title: 'Outliers Flagged',
      value: formatNumberSafe(totalOutliers),
      change: 'Detected IQR violations',
      icon: ShieldAlert,
      color: 'text-red-400',
    },
  ];

  const insights = [
    { type: 'info', text: 'Central SQLite database records all dataset profiles. Visualizations rendered dynamically in dataset pages.' },
    { type: 'warning', text: 'Total Outlier count lists values outside 1.5 * IQR boundaries in numeric columns.' },
    { type: 'success', text: 'Datasets index automatically links to detailed diagnostics gauges and charts.' },
  ];

  const recentDatasetsList = datasets?.slice(0, 5) || [];

  return (
    <div className="space-y-10">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">System Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Overview of your ingested datasets and quality profiles.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="refresh-dashboard-btn"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 rounded-lg text-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <Link 
            id="upload-dataset-dashboard-btn"
            href="/upload"
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition-all hover:scale-105 shadow-md flex items-center justify-center gap-2"
          >
            <span>Upload Dataset</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-6 flex flex-col justify-between gap-4 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 truncate pr-2">{card.title}</span>
                <div className={`p-2 bg-white/5 rounded-lg shrink-0 ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-extrabold text-white">{card.value}</span>
                <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span>{card.change}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Uploads Table */}
        <div className="lg:col-span-2 glass-card p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Recent Uploaded Datasets</h3>
          <div className="overflow-x-auto w-full">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-sm text-gray-400">
                <RefreshCw className="w-4 h-4 animate-spin text-violet-500" />
                <span>Loading recent datasets...</span>
              </div>
            ) : recentDatasetsList.length === 0 ? (
              <div className="text-center py-10 text-xs text-gray-500 font-medium">
                No datasets uploaded yet. Click "Upload Dataset" to begin.
              </div>
            ) : (
              <table className="w-full text-left text-sm text-gray-400 border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-xs text-gray-500 uppercase tracking-wider">
                    <th className="pb-3 pt-2 font-semibold">Filename</th>
                    <th className="pb-3 pt-2 font-semibold">Rows / Cols</th>
                    <th className="pb-3 pt-2 font-semibold">Health Score</th>
                    <th className="pb-3 pt-2 font-semibold">Storage Type</th>
                    <th className="pb-3 pt-2 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentDatasetsList.map((row) => (
                    <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 pr-3 text-white font-medium truncate max-w-[180px]" title={row.original_filename}>
                        {row.original_filename}
                      </td>
                      <td className="py-3.5 text-gray-300">
                        {row.total_rows !== null && row.total_rows !== undefined && row.total_columns !== null && row.total_columns !== undefined ? (
                          `${formatNumberSafe(row.total_rows)} / ${formatNumberSafe(row.total_columns)}`
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          (row.health_score ?? 0) >= 85 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' 
                            : (row.health_score ?? 0) >= 60 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/15'
                        }`}>
                          {row.health_score !== null && row.health_score !== undefined ? `${row.health_score}%` : '-'}
                        </span>
                      </td>
                      <td className="py-3.5 text-gray-300">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-white/5 border border-white/5 font-bold uppercase text-gray-400">
                          {row.storage_type}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <Link 
                          href={`/datasets/${row.id}`}
                          title="View profiling details"
                          className="p-1 text-gray-400 hover:text-white transition-all flex items-center justify-center w-7 h-7 hover:bg-white/5 rounded-lg border border-white/5"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* AI Insights Card */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            <span>AI Detective Insights</span>
          </h3>
          <div className="space-y-4">
            {insights.map((insight, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-lg text-xs leading-relaxed border ${
                  insight.type === 'warning'
                    ? 'bg-amber-500/5 text-amber-300 border-amber-500/10'
                    : insight.type === 'success'
                    ? 'bg-emerald-500/5 text-emerald-300 border-emerald-500/10'
                    : 'bg-indigo-500/5 text-indigo-300 border-indigo-500/10'
                }`}
              >
                <div className="flex gap-2.5 items-start">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{insight.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
