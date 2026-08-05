'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  FileSpreadsheet, 
  ShieldCheck, 
  ShieldAlert,
  AlertTriangle,
  Layers,
  LineChart,
  Grid
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  MissingValuesChart, 
  DataTypeDistributionChart, 
  ColumnCompletenessChart, 
  CategoryDistributionChart 
} from '@/components/ProfilerCharts';

interface ProfileResponse {
  id: string;
  dataset_id: string;
  total_rows: number;
  total_columns: number;
  health_score: number;
  total_missing_values: number;
  total_duplicate_rows: number;
  memory_usage_bytes: number;
  total_outliers: number;
  profile_data: {
    total_rows: number;
    total_columns: number;
    column_names: string[];
    detected_data_types: Record<string, string>;
    memory_usage_bytes: number;
    file_size_bytes: number;
    total_duplicate_rows: number;
    duplicate_percentage: number;
    total_missing_values: number;
    total_outliers: number;
    total_invalid_dates: number;
    health_score: number;
    health_breakdown: string[];
    columns: Record<string, any>;
  };
  created_at: string;
}

export default function DatasetDetailsPage({ params }: { params: { id: string } }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const { id } = params;
  
  const [activeTab, setActiveTab] = useState<'overview' | 'columns' | 'numeric' | 'categorical' | 'charts'>('overview');
  const [selectedCatCol, setSelectedCatCol] = useState<string>('');

  const { data: profile, isLoading, error } = useQuery<ProfileResponse>({
    queryKey: ['dataset-profile', id],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/api/v1/datasets/${id}/profile`);
      if (!res.ok) {
        throw new Error('Failed to fetch dataset profile details.');
      }
      return res.json();
    }
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Analyzing dataset profile records...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Dataset Profile Not Found</h2>
        <p className="text-sm text-gray-400">
          The requested profile failed or this dataset does not have active diagnostics metadata.
        </p>
        <Link href="/datasets" className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 font-semibold pt-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Ingested List</span>
        </Link>
      </div>
    );
  }

  const pData = profile.profile_data;
  const columnsList = Object.entries(pData.columns);
  const numericCols = columnsList.filter(([_, data]) => ["Integer", "Float"].includes(data.inferred_type));
  const categoricalCols = columnsList.filter(([_, data]) => ["Category", "Text", "Boolean"].includes(data.inferred_type));

  // Default selection
  if (!selectedCatCol && categoricalCols.length > 0) {
    setSelectedCatCol(categoricalCols[0][0]);
  }

  const selectedCatData = selectedCatCol ? pData.columns[selectedCatCol] : null;

  return (
    <div className="space-y-8">
      {/* Back button and Header */}
      <div className="space-y-4">
        <Link href="/datasets" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Datasets</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Dataset Diagnostics</h1>
              <p className="text-xs text-gray-400 font-mono mt-1">Dataset ID: {profile.dataset_id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics summary panels */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-card p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Total Rows</span>
          <p className="text-xl font-extrabold text-white">{pData.total_rows.toLocaleString()}</p>
        </div>
        <div className="glass-card p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Columns</span>
          <p className="text-xl font-extrabold text-white">{pData.total_columns.toLocaleString()}</p>
        </div>
        <div className="glass-card p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Missing Cells</span>
          <p className="text-xl font-extrabold text-white">{pData.total_missing_values.toLocaleString()}</p>
        </div>
        <div className="glass-card p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Memory footprint</span>
          <p className="text-xl font-extrabold text-white">{formatBytes(pData.memory_usage_bytes)}</p>
        </div>
        <div className="glass-card p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Total Outliers</span>
          <p className="text-xl font-extrabold text-white">{pData.total_outliers.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quality Health Score Card */}
        <section className="glass-card p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-1">
            <h3 className="text-md font-bold text-white">Ingestion Health Score</h3>
            <p className="text-xs text-gray-400">Data quality metrics calculated via weighted indices.</p>
          </div>
          
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="64" cy="64" r="54" stroke="rgba(255,255,255,0.03)" strokeWidth="10" fill="transparent" />
                <circle cx="64" cy="64" r="54" stroke="#8b5cf6" strokeWidth="10" fill="transparent"
                  strokeDasharray={2 * Math.PI * 54}
                  strokeDashoffset={2 * Math.PI * 54 * (1 - pData.health_score / 100)}
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white">{pData.health_score}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">GRADE</span>
              </div>
            </div>
            
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              pData.health_score >= 85 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' 
                : pData.health_score >= 60 
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' 
                : 'bg-red-500/10 text-red-400 border border-red-500/15'
            }`}>
              {pData.health_score >= 85 ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
              <span>{pData.health_score >= 85 ? 'Excellent Profile' : pData.health_score >= 60 ? 'Warning Flags' : 'Needs Ingest Cleanup'}</span>
            </span>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Score deductions checklist</h4>
            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
              {pData.health_breakdown.map((item, i) => (
                <div key={i} className="flex gap-2 items-start text-xs text-gray-400 leading-relaxed">
                  <span className="text-violet-400 mt-0.5">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tabbed Stats Panel */}
        <section className="lg:col-span-2 glass-card p-6 flex flex-col justify-between space-y-6">
          <div className="flex border-b border-white/5 pb-3 items-center gap-2 overflow-x-auto">
            {(['overview', 'columns', 'numeric', 'categorical', 'charts'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all shrink-0 ${
                  activeTab === tab 
                    ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-grow min-h-[350px]">
            {/* TAB: Overview Summary */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Diagnostics Summary</h3>
                  <p className="text-xs text-gray-400">Key insights for duplicate rows, columns and missing data.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 space-y-2">
                    <h4 className="text-xs font-bold text-gray-300">Ingestion Duplicate Analysis</h4>
                    <div className="flex justify-between items-end">
                      <span className="text-xl font-extrabold text-white">{pData.total_duplicate_rows}</span>
                      <span className="text-xs text-violet-400 font-semibold">{pData.duplicate_percentage.toFixed(2)}% of rows</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 space-y-2">
                    <h4 className="text-xs font-bold text-gray-300">File Ingestion specs</h4>
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-gray-400">Total Cells footprint:</span>
                      <span className="text-xs text-white font-bold">{(pData.total_rows * pData.total_columns).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-gray-400">Total Invalid Dates:</span>
                      <span className="text-xs text-white font-bold">{pData.total_invalid_dates}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Columns details */}
            {activeTab === 'columns' && (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-400 border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[10px] text-gray-500 uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Column</th>
                        <th className="pb-3 font-semibold">Inferred Type</th>
                        <th className="pb-3 font-semibold">Missing (Null)</th>
                        <th className="pb-3 font-semibold">Unique count</th>
                        <th className="pb-3 font-semibold">Duplicate count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {columnsList.map(([colName, col]) => (
                        <tr key={colName} className="hover:bg-white/[0.01]">
                          <td className="py-2.5 font-semibold text-white truncate max-w-[150px]" title={colName}>{colName}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/15">
                              {col.inferred_type}
                            </span>
                          </td>
                          <td className="py-2.5">{col.null_count} ({col.missing_percentage.toFixed(1)}%)</td>
                          <td className="py-2.5">{col.unique_values}</td>
                          <td className="py-2.5">{col.duplicate_values}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: Numeric bounds */}
            {activeTab === 'numeric' && (
              <div className="space-y-4">
                {numericCols.length === 0 ? (
                  <p className="text-xs text-gray-500 py-10 text-center font-medium">No numerical columns found to analyze.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-400 border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 text-[10px] text-gray-500 uppercase tracking-wider">
                          <th className="pb-3 font-semibold">Column</th>
                          <th className="pb-3 font-semibold">Mean</th>
                          <th className="pb-3 font-semibold">Median</th>
                          <th className="pb-3 font-semibold">Min / Max</th>
                          <th className="pb-3 font-semibold">Outliers</th>
                          <th className="pb-3 font-semibold">IQR Bounds</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {numericCols.map(([colName, col]) => (
                          <tr key={colName} className="hover:bg-white/[0.01]">
                            <td className="py-2.5 font-semibold text-white truncate max-w-[120px]" title={colName}>{colName}</td>
                            <td className="py-2.5">{col.mean?.toFixed(2)}</td>
                            <td className="py-2.5">{col.median?.toFixed(2)}</td>
                            <td className="py-2.5 text-gray-300 font-medium">
                              {col.min?.toFixed(1)} / {col.max?.toFixed(1)}
                            </td>
                            <td className="py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                col.outlier_count > 0 
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' 
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                              }`}>
                                {col.outlier_count} outliers
                              </span>
                            </td>
                            <td className="py-2.5 text-gray-500 text-[10px]">
                              [{col.lower_bound?.toFixed(1)}, {col.upper_bound?.toFixed(1)}]
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Categorical details */}
            {activeTab === 'categorical' && (
              <div className="space-y-6">
                {categoricalCols.length === 0 ? (
                  <p className="text-xs text-gray-500 py-10 text-center font-medium">No categorical columns found to analyze.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 border-r border-white/5 pr-4 flex flex-col gap-1.5 max-h-[300px] overflow-y-auto">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Select Column</span>
                      {categoricalCols.map(([colName]) => (
                        <button
                          key={colName}
                          onClick={() => setSelectedCatCol(colName)}
                          className={`text-left text-xs p-2 rounded-lg transition-all truncate ${
                            selectedCatCol === colName 
                              ? 'bg-violet-600/10 text-violet-400 border border-violet-500/15 font-semibold' 
                              : 'text-gray-400 hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          {colName}
                        </button>
                      ))}
                    </div>
                    
                    <div className="md:col-span-2 space-y-4">
                      {selectedCatData ? (
                        <>
                          <div className="flex justify-between items-end border-b border-white/5 pb-2">
                            <div>
                              <h4 className="text-sm font-bold text-white">{selectedCatCol}</h4>
                              <p className="text-[10px] text-gray-400 mt-0.5">Cardinality: {selectedCatData.cardinality} categories</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Top Category Distribution</span>
                            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                              {selectedCatData.top_categories?.map((cat: any, index: number) => {
                                const percentage = ((cat.count / pData.total_rows) * 100).toFixed(1);
                                return (
                                  <div key={index} className="space-y-1">
                                    <div className="flex justify-between text-xs font-semibold">
                                      <span className="text-gray-300 truncate max-w-[150px]">{cat.value}</span>
                                      <span className="text-gray-400">{cat.count.toLocaleString()} ({percentage}%)</span>
                                    </div>
                                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                      <div className="bg-violet-600 h-full rounded-full" style={{ width: `${percentage}%` }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-gray-500">Select a categorical column to show statistics details.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Recharts Visualizations */}
            {activeTab === 'charts' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="glass-card p-5 space-y-3">
                  <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-violet-400" />
                    <span>Missing Values Count</span>
                  </h4>
                  <MissingValuesChart columnsData={pData.columns} />
                </div>
                <div className="glass-card p-5 space-y-3">
                  <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                    <LineChart className="w-4 h-4 text-emerald-400" />
                    <span>Column Completeness (%)</span>
                  </h4>
                  <ColumnCompletenessChart columnsData={pData.columns} />
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
