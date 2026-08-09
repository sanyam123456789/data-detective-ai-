'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  FileSpreadsheet, 
  ShieldCheck, 
  ShieldAlert,
  AlertTriangle,
  Layers,
  LineChart,
  Grid,
  Sparkles,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Send,
  RefreshCw,
  Loader2,
  Lightbulb,
  BarChart3,
  Wrench,
  Brain,
  Bot,
  User,
  Info,
  WifiOff,
  Terminal,
  Code2,
  Copy,
  Check,
  Download,
  FileCode,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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

// ─── AI Response Types ────────────────────────────────────────────────────────

interface AISummary {
  overview: string;
  characteristics: string[];
  major_issues: string[];
  patterns: string[];
  next_steps: string[];
}

interface AIQualityInsight {
  title: string;
  issue: string;
  why_it_matters: string;
  recommendation: string;
  affected_columns: string[];
  confidence: 'low' | 'medium' | 'high';
}

interface AIQualityResponse {
  insights: AIQualityInsight[];
  summary: string;
}

interface AIRecommendation {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  affected_columns: string[];
  reason: string;
  confidence: 'low' | 'medium' | 'high';
}

interface AIRecommendationsResponse {
  recommendations: AIRecommendation[];
  high_priority_count: number;
}

interface AIColumnExplanation {
  column_name: string;
  likely_represents: string;
  data_type: string;
  missing_info: string;
  cardinality_info: string;
  statistics: string;
  quality_problems: string[];
  analysis_ideas: string[];
}

interface AIChatResponse {
  response: string;
  context_summary: string;
}

// ─── Phase 2C Response Types ──────────────────────────────────────────────────

interface SQLGenerationResponse {
  language: string;
  dialect: string;
  code: string;
  explanation: string[];
  used_columns: string[];
  warnings: string[];
  confidence: 'low' | 'medium' | 'high';
}

interface PySparkGenerationResponse {
  language: string;
  code: string;
  explanation: string[];
  used_columns: string[];
  warnings: string[];
  confidence: 'low' | 'medium' | 'high';
  dataset_path_variable: string;
}

// ─── Helper components ────────────────────────────────────────────────────────

function AIUnavailableBanner() {
  return (
    <div className="glass-card p-5 flex items-start gap-4 border-amber-500/20 bg-amber-500/5">
      <WifiOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-300">AI insights are temporarily unavailable</p>
        <p className="text-xs text-gray-400 mt-1">
          Your dataset profile and all charts are still available. Try generating AI insights again later.
        </p>
      </div>
    </div>
  );
}

function AILoadingSkeleton({ label }: { label: string }) {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-violet-600/20 flex items-center justify-center">
          <Loader2 className="w-4 h-4 text-violet-400 animate-spin" />
        </div>
        <span className="text-sm text-gray-400 font-medium animate-pulse">{label}</span>
      </div>
      <div className="space-y-3">
        <div className="h-3 bg-white/5 rounded-full animate-pulse w-3/4" />
        <div className="h-3 bg-white/5 rounded-full animate-pulse w-full" />
        <div className="h-3 bg-white/5 rounded-full animate-pulse w-5/6" />
        <div className="h-3 bg-white/5 rounded-full animate-pulse w-2/3" />
      </div>
    </div>
  );
}

function ConfidenceBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  const colors = {
    high: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border capitalize ${colors[level]}`}>
      {level} confidence
    </span>
  );
}

function PriorityBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  const colors = {
    high: 'bg-red-500/10 text-red-400 border-red-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold border uppercase tracking-wider ${colors[level]}`}>
      {level} priority
    </span>
  );
}

function GenerateButton({ 
  onClick, 
  loading, 
  label = 'Generate AI Insights',
  isRefresh = false 
}: { 
  onClick: () => void; 
  loading: boolean;
  label?: string;
  isRefresh?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/40 text-white transition-all shadow-lg shadow-violet-600/20 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isRefresh ? (
        <RefreshCw className="w-4 h-4" />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
      <span>{loading ? 'Analyzing...' : label}</span>
    </motion.button>
  );
}

// ─── AI Tab Sub-sections ──────────────────────────────────────────────────────

function AIOverviewSection({ datasetId, apiUrl }: { datasetId: string; apiUrl: string }) {
  const [triggered, setTriggered] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<AISummary>({
    queryKey: ['ai-summary', datasetId, forceRefresh],
    queryFn: async () => {
      const url = `${apiUrl}/api/v1/datasets/${datasetId}/ai/summary${forceRefresh ? '?force_refresh=true' : ''}`;
      const res = await fetch(url, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'AI summary failed');
      }
      return res.json();
    },
    enabled: triggered,
    retry: false,
  });

  const handleGenerate = (refresh = false) => {
    setForceRefresh(refresh);
    setTriggered(true);
    if (refresh) refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-400" />
            AI Executive Summary
          </h3>
          <p className="text-xs text-gray-400">
            AI-generated overview of your dataset based on profiling results.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <button
              onClick={() => handleGenerate(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-all"
            >
              <RefreshCw className="w-3 h-3" />
              Regenerate
            </button>
          )}
          {!triggered && (
            <GenerateButton onClick={() => handleGenerate(false)} loading={false} />
          )}
        </div>
      </div>

      {!triggered && (
        <div className="glass-card p-8 text-center space-y-3 border-dashed">
          <Sparkles className="w-8 h-8 text-violet-400/50 mx-auto" />
          <p className="text-sm text-gray-400">Click "Generate AI Insights" to analyze your dataset</p>
          <p className="text-xs text-gray-500">Results are cached — subsequent loads are instant</p>
        </div>
      )}

      {isLoading && <AILoadingSkeleton label="Analyzing dataset characteristics..." />}

      {error && <AIUnavailableBanner />}

      {data && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Overview */}
          <div className="glass-card p-5 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Overview</span>
            <p className="text-sm text-gray-200 leading-relaxed">{data.overview}</p>
          </div>

          {/* 3-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Characteristics */}
            <div className="glass-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-gray-300">Characteristics</span>
              </div>
              <ul className="space-y-2">
                {data.characteristics.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                    <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Major Issues */}
            <div className="glass-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-gray-300">Major Issues</span>
              </div>
              <ul className="space-y-2">
                {data.major_issues.length === 0 ? (
                  <li className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3" />
                    No major issues detected
                  </li>
                ) : (
                  data.major_issues.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                      <span className="text-amber-400 mt-0.5 shrink-0">⚠</span>
                      <span>{item}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Next Steps */}
            <div className="glass-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-gray-300">Next Steps</span>
              </div>
              <ul className="space-y-2">
                {data.next_steps.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                    <span className="text-emerald-400 font-bold mt-0.5 shrink-0">{i + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Patterns */}
          {data.patterns.length > 0 && (
            <div className="glass-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-bold text-gray-300">Notable Patterns</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.patterns.map((p, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg text-xs text-gray-300 bg-white/5 border border-white/5">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function AIQualitySection({ datasetId, apiUrl }: { datasetId: string; apiUrl: string }) {
  const [triggered, setTriggered] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const { data, isLoading, error, refetch } = useQuery<AIQualityResponse>({
    queryKey: ['ai-quality', datasetId],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/api/v1/datasets/${datasetId}/ai/quality`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'AI quality analysis failed');
      }
      return res.json();
    },
    enabled: triggered,
    retry: false,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            Data Quality Insights
          </h3>
          <p className="text-xs text-gray-400">AI-identified quality issues with explanations and recommendations.</p>
        </div>
        {!triggered ? (
          <GenerateButton onClick={() => setTriggered(true)} loading={false} />
        ) : (
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-all"
          >
            <RefreshCw className="w-3 h-3" /> Regenerate
          </button>
        )}
      </div>

      {!triggered && (
        <div className="glass-card p-8 text-center space-y-2 border-dashed">
          <AlertCircle className="w-8 h-8 text-amber-400/40 mx-auto" />
          <p className="text-sm text-gray-400">Generate AI quality analysis to identify issues</p>
        </div>
      )}

      {isLoading && <AILoadingSkeleton label="Analyzing data quality issues..." />}
      {error && <AIUnavailableBanner />}

      {data && !isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="glass-card p-4 border-violet-500/10">
            <p className="text-sm text-gray-300 leading-relaxed">{data.summary}</p>
          </div>
          
          {data.insights.length === 0 ? (
            <div className="text-center py-8 text-sm text-emerald-400 flex flex-col items-center gap-2">
              <CheckCircle className="w-8 h-8" />
              No significant data quality issues found!
            </div>
          ) : (
            <div className="space-y-3">
              {data.insights.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                    className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{insight.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <ConfidenceBadge level={insight.confidence} />
                          {insight.affected_columns.length > 0 && (
                            <span className="text-[9px] text-gray-500">
                              Affects: {insight.affected_columns.slice(0, 3).join(', ')}
                              {insight.affected_columns.length > 3 && ` +${insight.affected_columns.length - 3}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {expandedIndex === i ? (
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </button>

                  <AnimatePresence>
                    {expandedIndex === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0 border-t border-white/5 space-y-3 mt-0">
                          <div className="pt-3 space-y-3">
                            <div>
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Issue</span>
                              <p className="text-xs text-gray-300 leading-relaxed">{insight.issue}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Why It Matters</span>
                              <p className="text-xs text-gray-300 leading-relaxed">{insight.why_it_matters}</p>
                            </div>
                            <div className="bg-violet-500/5 border border-violet-500/15 rounded-lg p-3">
                              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block mb-1">Recommendation</span>
                              <p className="text-xs text-gray-300 leading-relaxed">{insight.recommendation}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function AIRecommendationsSection({ datasetId, apiUrl }: { datasetId: string; apiUrl: string }) {
  const [triggered, setTriggered] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<AIRecommendationsResponse>({
    queryKey: ['ai-recommendations', datasetId],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/api/v1/datasets/${datasetId}/ai/recommendations`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Recommendations failed');
      }
      return res.json();
    },
    enabled: triggered,
    retry: false,
  });

  const sortedRecs = data?.recommendations ? [...data.recommendations].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  }) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-emerald-400" />
            Cleaning Recommendations
          </h3>
          <p className="text-xs text-gray-400">Prioritized actions to improve your dataset quality.</p>
        </div>
        {!triggered ? (
          <GenerateButton onClick={() => setTriggered(true)} loading={false} />
        ) : (
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-all"
          >
            <RefreshCw className="w-3 h-3" /> Regenerate
          </button>
        )}
      </div>

      {!triggered && (
        <div className="glass-card p-8 text-center space-y-2 border-dashed">
          <Wrench className="w-8 h-8 text-emerald-400/40 mx-auto" />
          <p className="text-sm text-gray-400">Generate cleaning recommendations based on profiling</p>
        </div>
      )}

      {isLoading && <AILoadingSkeleton label="Generating cleaning recommendations..." />}
      {error && <AIUnavailableBanner />}

      {data && !isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {data.high_priority_count > 0 && (
            <div className="glass-card p-3 flex items-center gap-3 border-red-500/20 bg-red-500/5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-gray-300">
                <span className="font-bold text-red-400">{data.high_priority_count} high-priority</span> recommendation{data.high_priority_count !== 1 ? 's' : ''} require immediate attention.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {sortedRecs.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      rec.priority === 'high' ? 'bg-red-500/10 border border-red-500/20' :
                      rec.priority === 'medium' ? 'bg-amber-500/10 border border-amber-500/20' :
                      'bg-emerald-500/10 border border-emerald-500/20'
                    }`}>
                      <CheckCircle className={`w-4 h-4 ${
                        rec.priority === 'high' ? 'text-red-400' :
                        rec.priority === 'medium' ? 'text-amber-400' :
                        'text-emerald-400'
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{rec.title}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <PriorityBadge level={rec.priority} />
                        <ConfidenceBadge level={rec.confidence} />
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">{rec.description}</p>

                <div className="flex items-start gap-2 bg-white/[0.02] rounded-lg p-3 border border-white/5">
                  <Info className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-400 leading-relaxed">{rec.reason}</p>
                </div>

                {rec.affected_columns.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Affects:</span>
                    {rec.affected_columns.map(col => (
                      <span key={col} className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/15">
                        {col}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function AIColumnExplainerSection({ datasetId, apiUrl, columnNames }: { datasetId: string; apiUrl: string; columnNames: string[] }) {
  const [selectedColumn, setSelectedColumn] = useState(columnNames[0] || '');
  const [triggered, setTriggered] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  const { data, isLoading, error } = useQuery<AIColumnExplanation>({
    queryKey: ['ai-column', datasetId, selectedColumn, fetchKey],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/api/v1/datasets/${datasetId}/ai/column${fetchKey > 0 ? '?force_refresh=true' : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ column_name: selectedColumn }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Column explanation failed');
      }
      return res.json();
    },
    enabled: triggered && !!selectedColumn,
    retry: false,
  });

  const handleExplain = () => {
    setTriggered(true);
  };

  const handleColumnChange = (col: string) => {
    setSelectedColumn(col);
    setTriggered(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          Column Explainer
        </h3>
        <p className="text-xs text-gray-400">Get an AI-powered explanation of any column in your dataset.</p>
      </div>

      {/* Column selector + button */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <select
            value={selectedColumn}
            onChange={(e) => handleColumnChange(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all appearance-none cursor-pointer"
          >
            {columnNames.map(col => (
              <option key={col} value={col} className="bg-gray-900 text-white">{col}</option>
            ))}
          </select>
        </div>
        <GenerateButton 
          onClick={handleExplain} 
          loading={isLoading}
          label={triggered ? 'Explain Column' : 'Explain Column'}
        />
        {triggered && data && (
          <button
            onClick={() => { setFetchKey(k => k + 1); }}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-all"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>

      {isLoading && <AILoadingSkeleton label={`Analyzing column "${selectedColumn}"...`} />}
      {error && <AIUnavailableBanner />}

      {!triggered && !isLoading && (
        <div className="glass-card p-8 text-center space-y-2 border-dashed">
          <BarChart3 className="w-8 h-8 text-blue-400/40 mx-auto" />
          <p className="text-sm text-gray-400">Select a column and click "Explain Column"</p>
        </div>
      )}

      {data && !isLoading && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass-card p-5 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-white/5">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Grid className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-base font-bold text-white">{data.column_name}</p>
                <p className="text-xs text-gray-400">{data.data_type}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block mb-1">Likely Represents</span>
                <p className="text-sm text-gray-200 leading-relaxed">{data.likely_represents}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Missing Values</span>
                  <p className="text-xs text-gray-300 leading-relaxed">{data.missing_info}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Cardinality</span>
                  <p className="text-xs text-gray-300 leading-relaxed">{data.cardinality_info}</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Key Statistics</span>
                <p className="text-xs text-gray-300 leading-relaxed">{data.statistics}</p>
              </div>

              {data.quality_problems.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-2">Quality Problems</span>
                  <ul className="space-y-1.5">
                    {data.quality_problems.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                        <span className="text-amber-400 shrink-0 mt-0.5">⚠</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.analysis_ideas.length > 0 && (
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-2">Analysis Ideas</span>
                  <div className="flex flex-wrap gap-2">
                    {data.analysis_ideas.map((idea, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-lg text-xs text-gray-300 bg-emerald-500/5 border border-emerald-500/15">
                        💡 {idea}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

const SUGGESTED_QUESTIONS = [
  "What are the biggest data quality issues?",
  "Which columns need attention?",
  "Are there suspicious outliers?",
  "Give me a quick summary.",
  "What should I analyze next?",
];

function AIChatSection({ datasetId, apiUrl }: { datasetId: string; apiUrl: string }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || isLoading) return;

    setInput('');
    setError(null);

    const userMessage = { role: 'user' as const, content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const history = newMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${apiUrl}/api/v1/datasets/${datasetId}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history, max_history: 10 }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Chat request failed');
      }

      const data: AIChatResponse = await res.json();
      setMessages(prev => [...prev, { role: 'model', content: data.response }]);
    } catch (e: any) {
      setError(e.message || 'AI chat is temporarily unavailable.');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-violet-400" />
          Ask Data Detective
        </h3>
        <p className="text-xs text-gray-400">Ask anything about your dataset. AI responds based on profiling data.</p>
      </div>

      <div className="glass-card flex flex-col" style={{ height: '420px' }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full space-y-6 py-8">
              <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center">
                <Bot className="w-7 h-7 text-violet-400" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-white">Data Detective AI</p>
                <p className="text-xs text-gray-400">Ask anything about this dataset</p>
              </div>
              
              <div className="w-full space-y-2 max-w-sm">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">Suggested questions</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="px-3 py-1.5 rounded-lg text-xs text-gray-300 bg-white/5 border border-white/10 hover:border-violet-500/30 hover:bg-violet-500/5 hover:text-white transition-all text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                msg.role === 'user' 
                  ? 'bg-violet-600/20 border border-violet-500/30' 
                  : 'bg-white/5 border border-white/10'
              }`}>
                {msg.role === 'user' ? (
                  <User className="w-4 h-4 text-violet-400" />
                ) : (
                  <Bot className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-violet-600/15 border border-violet-500/20 text-white'
                  : 'bg-white/[0.03] border border-white/5 text-gray-200'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-gray-400" />
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400 animate-pulse">Thinking</span>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex gap-2 items-start text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
              <WifiOff className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t border-white/5">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about this dataset... (Enter to send)"
              disabled={isLoading}
              rows={2}
              className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all resize-none disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="p-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/30 text-white transition-all disabled:cursor-not-allowed shrink-0 shadow-lg shadow-violet-600/20"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Phase 2C — Code Studio Component ─────────────────────────────────────────

const SUGGESTED_CODE_PROMPTS = [
  "Find the top 10 customers by revenue",
  "Calculate monthly sales",
  "Remove duplicate records",
  "Find columns with missing values",
  "Calculate average order value",
  "Create a customer-level summary",
  "Clean invalid date values",
  "Create a PySpark ETL pipeline",
];

function AICodeStudioSection({ datasetId, apiUrl }: { datasetId: string; apiUrl: string }) {
  const [instruction, setInstruction] = useState('');
  const [activeLang, setActiveLang] = useState<'sql' | 'pyspark'>('sql');
  const [sqlResult, setSqlResult] = useState<SQLGenerationResponse | null>(null);
  const [pysparkResult, setPysparkResult] = useState<PySparkGenerationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (targetLang: 'sql' | 'pyspark', promptOverride?: string) => {
    const text = (promptOverride || instruction).trim();
    if (!text || isLoading) return;

    if (promptOverride) {
      setInstruction(promptOverride);
    }

    setIsLoading(true);
    setError(null);

    try {
      const endpoint = targetLang === 'sql' 
        ? `${apiUrl}/api/v1/datasets/${datasetId}/generate/sql`
        : `${apiUrl}/api/v1/datasets/${datasetId}/generate/pyspark`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction: text }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Code generation failed.');
      }

      const data = await res.json();
      if (targetLang === 'sql') {
        setSqlResult(data);
      } else {
        setPysparkResult(data);
      }
    } catch (e: any) {
      setError(e.message || 'Code generation is temporarily unavailable. Your dataset profile and AI insights are still available.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentResult = activeLang === 'sql' ? sqlResult : pysparkResult;

  const handleTabChange = (lang: 'sql' | 'pyspark') => {
    setActiveLang(lang);
    if (lang === 'sql' && !sqlResult && instruction.trim()) {
      handleGenerate('sql');
    } else if (lang === 'pyspark' && !pysparkResult && instruction.trim()) {
      handleGenerate('pyspark');
    }
  };

  const handleCopy = () => {
    if (!currentResult?.code) return;
    navigator.clipboard.writeText(currentResult.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!currentResult?.code) return;
    const blob = new Blob([currentResult.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dataset_${datasetId}_${activeLang}.${activeLang === 'sql' ? 'sql' : 'py'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-violet-400" />
          Code Studio — AI Data Engineering Generator
        </h3>
        <p className="text-xs text-gray-400">
          Generate production-ready SQL queries and PySpark DataFrame pipelines based on your dataset schema.
        </p>
      </div>

      {/* Input Form & Suggested Prompts */}
      <div className="glass-card p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
            What do you want to do with this dataset?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(activeLang); }}
              placeholder='e.g. "Find top 10 customers by total spend" or "Remove duplicates and calculate monthly sales"'
              disabled={isLoading}
              className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 focus:bg-violet-500/5 transition-all disabled:opacity-50"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleGenerate(activeLang)}
              disabled={!instruction.trim() || isLoading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/30 text-white transition-all shadow-lg shadow-violet-600/20 disabled:cursor-not-allowed shrink-0"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{isLoading ? 'Generating...' : 'Generate Code'}</span>
            </motion.button>
          </div>
        </div>

        {/* Suggested Prompts */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Suggested Instructions</span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_CODE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleGenerate(activeLang, prompt)}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-300 bg-white/5 border border-white/10 hover:border-violet-500/30 hover:bg-violet-500/5 hover:text-white transition-all disabled:opacity-50 text-left"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Language Selector & Code Viewer */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/10 rounded-xl">
            <button
              onClick={() => handleTabChange('sql')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeLang === 'sql'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              SQL Query
            </button>
            <button
              onClick={() => handleTabChange('pyspark')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeLang === 'pyspark'
                  ? 'bg-violet-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              PySpark Pipeline
            </button>
          </div>

          {currentResult && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-gray-400" />
                <span>Download .{activeLang === 'sql' ? 'sql' : 'py'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Loading skeleton */}
        {isLoading && <AILoadingSkeleton label={`Generating ${activeLang.toUpperCase()} code & step explanation...`} />}

        {/* Error message */}
        {error && (
          <div className="glass-card p-5 flex items-start gap-4 border-amber-500/20 bg-amber-500/5">
            <WifiOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-300">Code generation notice</p>
              <p className="text-xs text-gray-400 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !currentResult && !error && (
          <div className="glass-card p-12 text-center space-y-3 border-dashed">
            <Terminal className="w-10 h-10 text-violet-400/40 mx-auto" />
            <p className="text-sm text-gray-300 font-semibold">Ready to generate code</p>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Type an instruction above or click a suggested prompt to generate clean SQL or PySpark code for this dataset.
            </p>
          </div>
        )}

        {/* Code & Explanation Display */}
        {!isLoading && currentResult && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Warnings callout */}
            {currentResult.warnings && currentResult.warnings.length > 0 && (
              <div className="glass-card p-4 border-amber-500/20 bg-amber-500/5 space-y-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider">Schema Note / Warning</span>
                </div>
                {currentResult.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-gray-300 leading-relaxed">{w}</p>
                ))}
              </div>
            )}

            {/* Code Block Container */}
            <div className="rounded-xl overflow-hidden border border-white/10 bg-gray-950 font-mono">
              <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5" />
                  {activeLang === 'sql' ? `SQL (${(currentResult as SQLGenerationResponse).dialect || 'generic'})` : 'PySpark (DataFrame API)'}
                </span>
                <span className="text-[10px] text-gray-500">Preview & Download Only — Never Executed</span>
              </div>
              <div className="p-4 overflow-x-auto max-h-[450px]">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <tbody>
                    {currentResult.code.split('\n').map((line, index) => (
                      <tr key={index} className="hover:bg-white/[0.02]">
                        <td className="pr-4 py-0.5 text-gray-600 select-none text-right w-10 text-[11px] font-mono border-r border-white/5">
                          {index + 1}
                        </td>
                        <td className="pl-4 py-0.5 text-gray-200 whitespace-pre font-mono leading-relaxed">
                          {line}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Used Columns tags */}
            {currentResult.used_columns && currentResult.used_columns.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Referenced Schema Columns:</span>
                {currentResult.used_columns.map(col => (
                  <span key={col} className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    {col}
                  </span>
                ))}
              </div>
            )}

            {/* Explanation Section */}
            <div className="glass-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-violet-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Code Transformation Explanation</h4>
              </div>
              <ul className="space-y-2">
                {currentResult.explanation.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-gray-300 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function DatasetDetailsPage({ params }: { params: { id: string } }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const { id } = params;
  
  const [activeTab, setActiveTab] = useState<'overview' | 'columns' | 'numeric' | 'categorical' | 'charts' | 'ai' | 'code'>('overview');
  const [activeAITab, setActiveAITab] = useState<'summary' | 'quality' | 'recommendations' | 'column' | 'chat'>('summary');
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
  const columnNames = Object.keys(pData.columns);

  // Default selection
  if (!selectedCatCol && categoricalCols.length > 0) {
    setSelectedCatCol(categoricalCols[0][0]);
  }

  const selectedCatData = selectedCatCol ? pData.columns[selectedCatCol] : null;

  const mainTabs = ['overview', 'columns', 'numeric', 'categorical', 'charts', 'ai', 'code'] as const;

  const aiSubTabs: { key: typeof activeAITab; label: string; icon: React.ComponentType<any> }[] = [
    { key: 'summary', label: 'AI Overview', icon: Brain },
    { key: 'quality', label: 'Quality Insights', icon: AlertCircle },
    { key: 'recommendations', label: 'Recommendations', icon: Wrench },
    { key: 'column', label: 'Column Explainer', icon: BarChart3 },
    { key: 'chat', label: 'Ask Data Detective', icon: MessageSquare },
  ];

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
          <p className="text-xl font-extrabold text-white">{pData?.total_rows?.toLocaleString() ?? '-'}</p>
        </div>
        <div className="glass-card p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Columns</span>
          <p className="text-xl font-extrabold text-white">{pData?.total_columns?.toLocaleString() ?? '-'}</p>
        </div>
        <div className="glass-card p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Missing Cells</span>
          <p className="text-xl font-extrabold text-white">{pData?.total_missing_values?.toLocaleString() ?? '-'}</p>
        </div>
        <div className="glass-card p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Memory footprint</span>
          <p className="text-xl font-extrabold text-white">{formatBytes(pData?.memory_usage_bytes)}</p>
        </div>
        <div className="glass-card p-4 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Total Outliers</span>
          <p className="text-xl font-extrabold text-white">{pData?.total_outliers?.toLocaleString() ?? '-'}</p>
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
            {mainTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === tab 
                    ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab === 'ai' && <Sparkles className="w-3 h-3 text-violet-400" />}
                {tab === 'code' && <Terminal className="w-3 h-3 text-violet-400" />}
                {tab === 'ai' ? 'AI Intelligence' : tab === 'code' ? 'Code Studio' : tab}
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
                      <span className="text-xl font-extrabold text-white">{pData?.total_duplicate_rows ?? '-'}</span>
                      <span className="text-xs text-violet-400 font-semibold">
                        {pData?.duplicate_percentage !== undefined && pData?.duplicate_percentage !== null ? `${pData.duplicate_percentage.toFixed(2)}%` : '-'} of rows
                      </span>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 space-y-2">
                    <h4 className="text-xs font-bold text-gray-300">File Ingestion specs</h4>
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-gray-400">Total Cells footprint:</span>
                      <span className="text-xs text-white font-bold">
                        {pData?.total_rows !== undefined && pData?.total_rows !== null && pData?.total_columns !== undefined && pData?.total_columns !== null 
                          ? (pData.total_rows * pData.total_columns).toLocaleString() 
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-gray-400">Total Invalid Dates:</span>
                      <span className="text-xs text-white font-bold">{pData?.total_invalid_dates ?? '-'}</span>
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
                                const totalRows = pData?.total_rows ?? 0;
                                const percentage = totalRows > 0 && cat?.count !== undefined && cat?.count !== null
                                  ? ((cat.count / totalRows) * 100).toFixed(1)
                                  : '0.0';
                                return (
                                  <div key={index} className="space-y-1">
                                    <div className="flex justify-between text-xs font-semibold">
                                      <span className="text-gray-300 truncate max-w-[150px]">{cat?.value ?? '-'}</span>
                                      <span className="text-gray-400">
                                        {cat?.count !== undefined && cat?.count !== null ? cat.count.toLocaleString() : '-'} ({percentage}%)
                                      </span>
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

            {/* TAB: AI Intelligence */}
            {activeTab === 'ai' && (
              <div className="space-y-5">
                {/* AI sub-tab navigation */}
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {aiSubTabs.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveAITab(key)}
                      className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        activeAITab === key
                          ? 'bg-violet-600/15 text-violet-300 border border-violet-500/25'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* AI sub-tab content */}
                <div>
                  {activeAITab === 'summary' && (
                    <AIOverviewSection datasetId={id} apiUrl={apiUrl} />
                  )}
                  {activeAITab === 'quality' && (
                    <AIQualitySection datasetId={id} apiUrl={apiUrl} />
                  )}
                  {activeAITab === 'recommendations' && (
                    <AIRecommendationsSection datasetId={id} apiUrl={apiUrl} />
                  )}
                  {activeAITab === 'column' && (
                    <AIColumnExplainerSection datasetId={id} apiUrl={apiUrl} columnNames={columnNames} />
                  )}
                  {activeAITab === 'chat' && (
                    <AIChatSection datasetId={id} apiUrl={apiUrl} />
                  )}
                </div>
              </div>
            )}

            {/* TAB: Code Studio */}
            {activeTab === 'code' && (
              <AICodeStudioSection datasetId={id} apiUrl={apiUrl} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
