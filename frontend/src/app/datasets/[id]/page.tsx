'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Send,
  RefreshCw,
  Loader2,
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
  Cloud,
  CloudOff,
  Database,
  Table2,
  Play,
  Clock,
  HardDrive,
  Zap,
  ServerCrash,
  SquareArrowRight,
  FolderOpen,
  FileSearch,
  CheckCheck
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

// ─── Phase 2D: Pipeline + Athena Types ──────────────────────────────────────

interface PipelineStatusResponse {
  dataset_id: string;
  pipeline_status: string;
  storage_provider: string;
  raw_s3_key: string | null;
  curated_s3_key: string | null;
  catalog_database: string | null;
  catalog_table: string | null;
  pipeline_error: string | null;
  processed_at: string | null;
  aws_configured: boolean;
  athena_query_table: string | null;
}

interface AthenaQueryResponse {
  query_execution_id: string;
  status: string;
  columns: string[];
  rows: (string | null)[][];
  row_count: number;
  execution_time_ms: number;
  data_scanned_bytes: number;
  data_scanned_mb: number;
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

// ─── Forensic Helper Components ───────────────────────────────────────────────

function AIUnavailableBanner() {
  return (
    <div className="ledger-card p-4 flex items-start gap-3 border-evidence-amber/30 bg-ink-950">
      <WifiOff className="w-4 h-4 text-evidence-amber shrink-0 mt-0.5" />
      <div className="font-mono text-xs">
        <p className="font-bold text-evidence-amber uppercase">AI Forensic Intelligence Temporarily Offline</p>
        <p className="text-paper-400 mt-0.5 font-body text-xs">
          Statistical profile matrices and schema ledgers remain active. Re-attempt AI forensic synthesis shortly.
        </p>
      </div>
    </div>
  );
}

function AILoadingSkeleton({ label }: { label: string }) {
  return (
    <div className="ledger-card p-6 space-y-4 font-mono">
      <div className="flex items-center gap-3">
        <Loader2 className="w-4 h-4 text-evidence-amber animate-spin" />
        <span className="text-xs text-paper-300 font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="space-y-2">
        <div className="h-2 bg-ink-800 rounded w-3/4 animate-pulse border border-ruling" />
        <div className="h-2 bg-ink-800 rounded w-full animate-pulse border border-ruling" />
        <div className="h-2 bg-ink-800 rounded w-5/6 animate-pulse border border-ruling" />
      </div>
    </div>
  );
}

function ConfidenceBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  const styles = {
    high: 'stamp-tag-emerald',
    medium: 'stamp-tag-amber',
    low: 'stamp-tag-muted',
  };
  return (
    <span className={`stamp-tag ${styles[level]} text-[9px]`}>
      {level} confidence
    </span>
  );
}

function PriorityBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  const styles = {
    high: 'stamp-tag-crimson',
    medium: 'stamp-tag-amber',
    low: 'stamp-tag-emerald',
  };
  return (
    <span className={`stamp-tag ${styles[level]} text-[9px]`}>
      {level} priority
    </span>
  );
}

function GenerateButton({ 
  onClick, 
  loading, 
  label = 'Interrogate Dataset',
  isRefresh = false 
}: { 
  onClick: () => void; 
  loading: boolean;
  label?: string;
  isRefresh?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="btn-primary text-xs"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isRefresh ? (
        <RefreshCw className="w-3.5 h-3.5" />
      ) : (
        <Sparkles className="w-3.5 h-3.5" />
      )}
      <span>{loading ? 'Synthesizing Evidence...' : label}</span>
    </button>
  );
}

// ─── AI Overview Section ──────────────────────────────────────────────────────

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
      <div className="flex items-start justify-between gap-4 flex-wrap border-b border-ruling pb-3">
        <div>
          <h3 className="font-mono text-xs font-bold text-paper-100 uppercase flex items-center gap-2">
            <Brain className="w-3.5 h-3.5 text-evidence-amber" />
            <span>Forensic Executive Summary</span>
          </h3>
          <p className="text-xs font-mono text-paper-400 mt-0.5">
            HIGH-LEVEL AUDIT PROFILE & ANOMALY ASSESSMENT
          </p>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <button
              onClick={() => handleGenerate(true)}
              className="btn-secondary text-xs"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Regenerate</span>
            </button>
          )}
          {!triggered && (
            <GenerateButton onClick={() => handleGenerate(false)} loading={false} />
          )}
        </div>
      </div>

      {!triggered && (
        <div className="ledger-card p-8 text-center space-y-3 font-mono">
          <FileSearch className="w-8 h-8 text-evidence-amber mx-auto" />
          <p className="text-xs font-bold text-paper-100 uppercase">Initialize Forensic Synthesis</p>
          <p className="text-[11px] text-paper-400 font-body max-w-sm mx-auto">
            Click to command AI interrogation across statistical distributions, null ratios, and categorical entropy.
          </p>
        </div>
      )}

      {isLoading && <AILoadingSkeleton label="Synthesizing forensic executive summary..." />}
      {error && <AIUnavailableBanner />}

      {data && !isLoading && (
        <div className="space-y-4 font-mono">
          {/* Overview Container */}
          <div className="ledger-card p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-ruling pb-1.5">
              <span className="text-[10px] font-bold uppercase text-evidence-amber">Primary Diagnostic Overview</span>
              <span className="stamp-tag stamp-tag-cyan text-[9px]">SYNTHESIZED</span>
            </div>
            <p className="text-xs text-paper-200 font-body leading-relaxed">{data.overview}</p>
          </div>

          {/* Characteristics & Patterns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="ledger-card p-4 space-y-2">
              <span className="text-[10px] font-bold uppercase text-paper-400 block border-b border-ruling pb-1">
                Structural Characteristics
              </span>
              <ul className="space-y-1.5 text-xs text-paper-300 font-body">
                {data.characteristics.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-evidence-cyan font-mono">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="ledger-card p-4 space-y-2">
              <span className="text-[10px] font-bold uppercase text-paper-400 block border-b border-ruling pb-1">
                Detected Data Patterns
              </span>
              <ul className="space-y-1.5 text-xs text-paper-300 font-body">
                {data.patterns.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-evidence-emerald font-mono">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Major Issues Callout */}
          {data.major_issues && data.major_issues.length > 0 && (
            <div className="ledger-card p-4 border-evidence-crimson/40 bg-ink-950 space-y-2">
              <div className="flex items-center gap-2 text-evidence-crimson">
                <ShieldAlert className="w-4 h-4" />
                <span className="text-xs font-bold uppercase">Major Forensic Anomalies Intercepted</span>
              </div>
              <ul className="space-y-1 text-xs text-paper-300 font-body">
                {data.major_issues.map((issue, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-evidence-crimson font-mono">&gt;</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AI Quality Section ───────────────────────────────────────────────────────

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
      <div className="flex items-start justify-between gap-4 flex-wrap border-b border-ruling pb-3">
        <div>
          <h3 className="font-mono text-xs font-bold text-paper-100 uppercase flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-evidence-amber" />
            <span>Quality Defects & Anomaly Register</span>
          </h3>
          <p className="text-xs font-mono text-paper-400 mt-0.5">
            ROOT-CAUSE EXPLANATIONS AND REMEDIATION ADVICE
          </p>
        </div>
        {!triggered ? (
          <GenerateButton onClick={() => setTriggered(true)} loading={false} label="Audit Quality Defects" />
        ) : (
          <button
            onClick={() => refetch()}
            className="btn-secondary text-xs"
          >
            <RefreshCw className="w-3 h-3" /> 
            <span>Re-Audit</span>
          </button>
        )}
      </div>

      {!triggered && (
        <div className="ledger-card p-8 text-center space-y-2 font-mono">
          <AlertCircle className="w-8 h-8 text-evidence-amber/60 mx-auto" />
          <p className="text-xs font-bold text-paper-100 uppercase">Run Forensic Quality Audit</p>
          <p className="text-[11px] text-paper-400 font-body max-w-sm mx-auto">
            Interrogate table schema for null cascades, cardinality collapse, and date parse exceptions.
          </p>
        </div>
      )}

      {isLoading && <AILoadingSkeleton label="Auditing dataset quality defects..." />}
      {error && <AIUnavailableBanner />}

      {data && !isLoading && (
        <div className="space-y-4 font-mono">
          <div className="ledger-card p-3.5 bg-ink-950 border-ruling">
            <p className="text-xs text-paper-200 font-body leading-relaxed">{data.summary}</p>
          </div>
          
          {data.insights.length === 0 ? (
            <div className="p-8 text-center text-xs text-evidence-emerald flex flex-col items-center gap-2 ledger-card">
              <CheckCheck className="w-8 h-8" />
              <span className="font-bold uppercase">No Critical Quality Defects Intercepted</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.insights.map((insight, i) => (
                <div key={i} className="ledger-card overflow-hidden">
                  <button
                    onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                    className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-ink-850 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-[10px] font-mono font-bold text-evidence-amber">
                        #{String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-paper-100 truncate">{insight.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <ConfidenceBadge level={insight.confidence} />
                          {insight.affected_columns.length > 0 && (
                            <span className="text-[10px] text-paper-400">
                              AFFECTS: {insight.affected_columns.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {expandedIndex === i ? (
                      <ChevronDown className="w-4 h-4 text-paper-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-paper-400 shrink-0" />
                    )}
                  </button>

                  {expandedIndex === i && (
                    <div className="px-4 pb-4 pt-2 border-t border-ruling space-y-3 bg-ink-950 font-mono text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-paper-400 uppercase tracking-wider block mb-1">Defect Analysis</span>
                        <p className="text-xs text-paper-200 font-body leading-relaxed">{insight.issue}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-paper-400 uppercase tracking-wider block mb-1">Downstream Impact</span>
                        <p className="text-xs text-paper-200 font-body leading-relaxed">{insight.why_it_matters}</p>
                      </div>
                      <div className="p-3 bg-ink-900 border border-ruling rounded">
                        <span className="text-[10px] font-bold text-evidence-amber uppercase tracking-wider block mb-1">Prescribed Remediation</span>
                        <p className="text-xs text-paper-200 font-body leading-relaxed">{insight.recommendation}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AI Recommendations Section ───────────────────────────────────────────────

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
      <div className="flex items-start justify-between gap-4 flex-wrap border-b border-ruling pb-3">
        <div>
          <h3 className="font-mono text-xs font-bold text-paper-100 uppercase flex items-center gap-2">
            <Wrench className="w-3.5 h-3.5 text-evidence-amber" />
            <span>Remediation Action Playbook</span>
          </h3>
          <p className="text-xs font-mono text-paper-400 mt-0.5">
            PRIORITIZED DATA REPAIR & ENGINEERING STEPS
          </p>
        </div>
        {!triggered ? (
          <GenerateButton onClick={() => setTriggered(true)} loading={false} label="Generate Playbook" />
        ) : (
          <button
            onClick={() => refetch()}
            className="btn-secondary text-xs"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        )}
      </div>

      {!triggered && (
        <div className="ledger-card p-8 text-center space-y-2 font-mono">
          <Wrench className="w-8 h-8 text-evidence-amber/60 mx-auto" />
          <p className="text-xs font-bold text-paper-100 uppercase">Compile Remediation Playbook</p>
          <p className="text-[11px] text-paper-400 font-body max-w-sm mx-auto">
            Calculates high, medium, and low-priority fixes for production pipeline readiness.
          </p>
        </div>
      )}

      {isLoading && <AILoadingSkeleton label="Formulating remediation playbook..." />}
      {error && <AIUnavailableBanner />}

      {data && !isLoading && (
        <div className="space-y-3 font-mono">
          {sortedRecs.map((rec, i) => (
            <div key={i} className="ledger-card p-4 space-y-2">
              <div className="flex items-center justify-between gap-2 border-b border-ruling pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-evidence-amber">#{String(i + 1).padStart(2, '0')}</span>
                  <h4 className="text-xs font-bold text-paper-100">{rec.title}</h4>
                </div>
                <div className="flex items-center gap-2">
                  <PriorityBadge level={rec.priority} />
                  <ConfidenceBadge level={rec.confidence} />
                </div>
              </div>
              <p className="text-xs text-paper-200 font-body leading-relaxed">{rec.description}</p>
              <div className="pt-1 text-[11px] text-paper-400 flex items-center justify-between">
                <span>RATIONALE: {rec.reason}</span>
                {rec.affected_columns.length > 0 && (
                  <span className="text-evidence-cyan">
                    COLS: {rec.affected_columns.join(', ')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AI Column Explainer Section ──────────────────────────────────────────────

function AIColumnExplainerSection({ datasetId, apiUrl, columnNames }: { datasetId: string; apiUrl: string; columnNames: string[] }) {
  const [selectedColumn, setSelectedColumn] = useState<string>(columnNames[0] || '');
  const [triggered, setTriggered] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  const { data, isLoading, error } = useQuery<AIColumnExplanation>({
    queryKey: ['ai-column-explain', datasetId, selectedColumn, fetchKey],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/api/v1/datasets/${datasetId}/ai/columns/${selectedColumn}/explain`, { method: 'POST' });
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
    setFetchKey(k => k + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-ruling pb-3">
        <div>
          <h3 className="font-mono text-xs font-bold text-paper-100 uppercase flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-evidence-amber" />
            <span>Column Interrogation Ledger</span>
          </h3>
          <p className="text-xs font-mono text-paper-400 mt-0.5">
            ISOLATED STATISTICAL PROFILE & SEMANTIC CLASSIFICATION
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
            className="bg-ink-950 border border-ruling rounded px-3 py-1.5 text-xs text-paper-100 focus:border-evidence-amber"
          >
            {columnNames.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
          <button
            onClick={handleExplain}
            disabled={isLoading}
            className="btn-primary text-xs"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Interrogate</span>}
          </button>
        </div>
      </div>

      {isLoading && <AILoadingSkeleton label={`Interrogating column "${selectedColumn}"...`} />}
      {error && <AIUnavailableBanner />}

      {!triggered && !isLoading && (
        <div className="ledger-card p-8 text-center space-y-2 font-mono">
          <Grid className="w-8 h-8 text-evidence-amber/60 mx-auto" />
          <p className="text-xs font-bold text-paper-100 uppercase">Select Target Column</p>
          <p className="text-[11px] text-paper-400 font-body max-w-sm mx-auto">
            Choose any schema field to extract its inferred business semantics, missingness profile, and potential data risks.
          </p>
        </div>
      )}

      {data && !isLoading && (
        <div className="ledger-card p-5 space-y-4 font-mono">
          <div className="flex items-center justify-between pb-3 border-b border-ruling">
            <div>
              <p className="text-sm font-bold text-paper-50">{data.column_name}</p>
              <p className="text-[11px] text-paper-400 mt-0.5">DATA TYPE: {data.data_type}</p>
            </div>
            <span className="stamp-tag stamp-tag-amber text-[9px]">COLUMN PROFILE</span>
          </div>

          <div className="space-y-4">
            <div className="p-3 bg-ink-950 rounded border border-ruling space-y-1">
              <span className="text-[10px] font-bold text-evidence-amber uppercase block">Inferred Semantic Meaning</span>
              <p className="text-xs text-paper-200 font-body">{data.likely_represents}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-ink-950 rounded border border-ruling space-y-1">
                <span className="text-[10px] font-bold text-paper-400 uppercase block">Null Distribution</span>
                <p className="text-xs text-paper-300 font-body">{data.missing_info}</p>
              </div>
              <div className="p-3 bg-ink-950 rounded border border-ruling space-y-1">
                <span className="text-[10px] font-bold text-paper-400 uppercase block">Cardinality & Uniqueness</span>
                <p className="text-xs text-paper-300 font-body">{data.cardinality_info}</p>
              </div>
            </div>

            <div className="p-3 bg-ink-950 rounded border border-ruling space-y-1">
              <span className="text-[10px] font-bold text-paper-400 uppercase block">Statistical Coordinates</span>
              <p className="text-xs text-paper-300 font-body">{data.statistics}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI Chat Section ──────────────────────────────────────────────────────────

const SUGGESTED_QUESTIONS = [
  "What are the biggest quality defects?",
  "Which columns exhibit high null ratios?",
  "Are there statistical outliers in numeric fields?",
  "Summarize key schema risks for ETL.",
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
    <div className="space-y-4 font-mono">
      <div className="flex items-center justify-between border-b border-ruling pb-2">
        <h3 className="text-xs font-bold text-paper-100 uppercase flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-evidence-amber" />
          <span>Forensic Investigator Terminal</span>
        </h3>
        <span className="stamp-tag stamp-tag-amber text-[9px]">LIVE CHAT INTERROGATION</span>
      </div>

      <div className="ledger-card flex flex-col" style={{ height: '440px' }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full space-y-4 py-6 text-center">
              <div className="w-10 h-10 rounded bg-ink-800 border border-ruling flex items-center justify-center text-evidence-amber">
                <Bot className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-paper-100 uppercase">Data Detective Interrogation Terminal</p>
                <p className="text-[11px] text-paper-400">Ask any question regarding dataset distributions and anomalies.</p>
              </div>
              
              <div className="space-y-1.5 max-w-md pt-2">
                <span className="text-[9px] font-bold text-paper-400 uppercase tracking-wider block">Suggested Queries:</span>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="px-2.5 py-1 rounded text-[11px] text-paper-300 bg-ink-950 border border-ruling hover:border-evidence-amber hover:text-paper-100 transition-all text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 border ${
                msg.role === 'user' 
                  ? 'bg-ink-800 border-evidence-amber text-evidence-amber' 
                  : 'bg-ink-950 border-ruling text-paper-400'
              }`}>
                {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div className={`max-w-[85%] rounded p-3 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-ink-800 border border-ruling text-paper-100'
                  : 'bg-ink-950 border border-ruling text-paper-200 font-body'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2 items-center text-xs text-evidence-amber">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing forensic docket context...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded bg-ink-950 border border-evidence-crimson/40 text-evidence-crimson text-xs">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t border-ruling bg-ink-950">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter interrogation query... (Press Enter to execute)"
              disabled={isLoading}
              className="flex-1 bg-ink-900 border border-ruling rounded px-3 py-2 text-xs text-paper-100 placeholder-paper-400 focus:border-evidence-amber"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="btn-primary text-xs py-2 px-3"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Code Studio Section ──────────────────────────────────────────────────────

const SUGGESTED_CODE_PROMPTS = [
  "Find top 10 rows by numeric volume",
  "Filter out rows with null values",
  "Calculate aggregate sums by category",
  "Build a PySpark cleaning pipeline",
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
      setError(e.message || 'Code generation is temporarily unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentResult = activeLang === 'sql' ? sqlResult : pysparkResult;

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
    link.download = `pipeline_${datasetId}_${activeLang}.${activeLang === 'sql' ? 'sql' : 'py'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-mono">
      <div className="flex items-center justify-between border-b border-ruling pb-3">
        <div>
          <h3 className="text-xs font-bold text-paper-100 uppercase flex items-center gap-2">
            <Code2 className="w-3.5 h-3.5 text-evidence-amber" />
            <span>Forensic Code & Pipeline Studio</span>
          </h3>
          <p className="text-xs text-paper-400 mt-0.5">
            SYNTHESIZE CLEANING SQL & PRODUCTION PYSPARK SCRIPTS
          </p>
        </div>
      </div>

      {/* Input Form & Prompts */}
      <div className="ledger-card p-4 space-y-3">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-paper-400 uppercase tracking-wider block">
            Pipeline Transformation Objective
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(activeLang); }}
              placeholder='e.g. "Quarantine outliers in fare_amount and calculate average trip speed"'
              disabled={isLoading}
              className="flex-1 bg-ink-950 border border-ruling rounded px-3 py-2 text-xs text-paper-100 focus:border-evidence-amber"
            />
            <button
              onClick={() => handleGenerate(activeLang)}
              disabled={!instruction.trim() || isLoading}
              className="btn-primary text-xs"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>Generate Code</span>
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-ruling flex items-center gap-2 flex-wrap">
          <span className="text-[9px] font-bold text-paper-400 uppercase">Presets:</span>
          {SUGGESTED_CODE_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleGenerate(activeLang, prompt)}
              className="px-2 py-0.5 rounded text-[10px] text-paper-300 bg-ink-950 border border-ruling hover:border-evidence-amber"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Language Switcher & Editor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-1.5">
            <button
              onClick={() => { setActiveLang('sql'); if (!sqlResult && instruction) handleGenerate('sql'); }}
              className={`px-3 py-1.5 rounded text-xs border ${
                activeLang === 'sql' ? 'bg-ink-800 border-ruling text-paper-100 font-bold' : 'text-paper-400 border-transparent hover:bg-ink-850'
              }`}
            >
              SQL Query (ANSI/DuckDB)
            </button>
            <button
              onClick={() => { setActiveLang('pyspark'); if (!pysparkResult && instruction) handleGenerate('pyspark'); }}
              className={`px-3 py-1.5 rounded text-xs border ${
                activeLang === 'pyspark' ? 'bg-ink-800 border-ruling text-paper-100 font-bold' : 'text-paper-400 border-transparent hover:bg-ink-850'
              }`}
            >
              PySpark Pipeline (Lakehouse)
            </button>
          </div>

          {currentResult && (
            <div className="flex items-center gap-2">
              <button onClick={handleCopy} className="btn-secondary text-[11px] py-1 px-2.5">
                {copied ? <Check className="w-3 h-3 text-evidence-emerald" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Code'}</span>
              </button>
              <button onClick={handleDownload} className="btn-secondary text-[11px] py-1 px-2.5">
                <Download className="w-3 h-3" />
                <span>Download .{activeLang === 'sql' ? 'sql' : 'py'}</span>
              </button>
            </div>
          )}
        </div>

        {isLoading && <AILoadingSkeleton label={`Compiling ${activeLang.toUpperCase()} transformation pipeline...`} />}

        {!isLoading && currentResult && (
          <div className="space-y-4">
            {currentResult.warnings && currentResult.warnings.length > 0 && (
              <div className="ledger-card p-3 border-evidence-amber/40 bg-ink-950 text-xs">
                <span className="text-[10px] font-bold text-evidence-amber uppercase block mb-1">Forensic Schema Warnings:</span>
                {currentResult.warnings.map((w, i) => (
                  <p key={i} className="text-paper-300 text-[11px]">{w}</p>
                ))}
              </div>
            )}

            <div className="ledger-card overflow-hidden">
              <div className="ledger-header flex items-center justify-between">
                <span>{activeLang === 'sql' ? 'ANSI SQL CLEANSE' : 'PYSPARK ETL PIPELINE'}</span>
                <span className="text-[10px] text-paper-400">READY TO INTEGRATE</span>
              </div>
              <div className="p-4 bg-ink-950 overflow-x-auto max-h-[400px]">
                <pre className="text-xs text-paper-100 font-mono leading-relaxed">{currentResult.code}</pre>
              </div>
            </div>

            {currentResult.explanation && (
              <div className="ledger-card p-4 space-y-2">
                <span className="text-[10px] font-bold uppercase text-paper-400 block border-b border-ruling pb-1">
                  Transformation Logic Steps:
                </span>
                <ul className="space-y-1.5 text-xs text-paper-300 font-body">
                  {currentResult.explanation.map((step, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-evidence-amber font-mono font-bold">{i + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Data Pipeline Section ────────────────────────────────────────────────────

function DataPipelineSection({ datasetId, apiUrl }: { datasetId: string; apiUrl: string }) {
  const { data: pipeline, isLoading, refetch } = useQuery<PipelineStatusResponse>({
    queryKey: ['pipeline-status', datasetId],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/api/v1/datasets/${datasetId}/pipeline`);
      if (!res.ok) throw new Error('Failed to fetch pipeline status');
      return res.json();
    },
  });

  const status = pipeline?.pipeline_status || 'LOCAL';

  return (
    <div className="space-y-6 font-mono">
      <div className="flex items-center justify-between border-b border-ruling pb-3">
        <div>
          <h3 className="text-xs font-bold text-paper-100 uppercase flex items-center gap-2">
            <Cloud className="w-3.5 h-3.5 text-evidence-amber" />
            <span>Lakehouse Partition & Athena Query Pipeline</span>
          </h3>
          <p className="text-xs text-paper-400 mt-0.5">
            AWS S3 IMMUTABLE LAKEHOUSE ENCLAVE STATUS
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="stamp-tag stamp-tag-amber text-[9px]">{status}</span>
          <button onClick={() => refetch()} className="btn-secondary text-xs py-1 px-2.5">
            <RefreshCw className="w-3 h-3" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {!pipeline?.aws_configured && !isLoading && (
        <div className="ledger-card p-4 flex items-start gap-3 border-ruling bg-ink-950">
          <CloudOff className="w-4 h-4 text-paper-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <p className="font-bold text-paper-200 uppercase">Local Filesystem Mode Active</p>
            <p className="text-paper-400 font-body">
              AWS Lakehouse partitions are optional. All local forensic audits, AI interrogations, and SQL code scripts operate natively on local storage.
            </p>
          </div>
        </div>
      )}

      {pipeline?.aws_configured && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="ledger-card p-4 space-y-2">
            <span className="text-[10px] font-bold text-paper-400 uppercase block">S3 Bucket Custody</span>
            <p className="text-xs text-paper-100 font-bold">{pipeline.storage_provider}</p>
            <p className="text-[11px] text-paper-400 truncate">RAW: {pipeline.raw_s3_key || 'N/A'}</p>
          </div>
          <div className="ledger-card p-4 space-y-2">
            <span className="text-[10px] font-bold text-paper-400 uppercase block">Glue Data Catalog</span>
            <p className="text-xs text-paper-100 font-bold">{pipeline.catalog_database || 'default'}</p>
            <p className="text-[11px] text-paper-400">TABLE: {pipeline.catalog_table || 'unregistered'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Dataset Details Page ────────────────────────────────────────────────

export default function DatasetDetailsPage({ params }: { params: { id: string } }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const { id } = params;
  
  const [activeTab, setActiveTab] = useState<'overview' | 'columns' | 'numeric' | 'categorical' | 'charts' | 'ai' | 'code' | 'pipeline'>('overview');
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
      <div className="flex flex-col items-center justify-center py-32 gap-3 font-mono text-xs text-paper-400">
        <RefreshCw className="w-6 h-6 text-evidence-amber animate-spin" />
        <span>INTERROGATING DATASET SPECIMEN #{id.slice(0, 8)}...</span>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="ledger-card p-8 max-w-xl mx-auto text-center space-y-4 font-mono">
        <AlertTriangle className="w-10 h-10 text-evidence-crimson mx-auto" />
        <h2 className="text-sm font-bold text-paper-50 uppercase">Case Dossier Not Found</h2>
        <p className="text-xs text-paper-400 font-body">
          Unable to locate active profile telemetry for case reference #{id}.
        </p>
        <Link href="/datasets" className="btn-secondary text-xs inline-flex mt-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Evidence Vault</span>
        </Link>
      </div>
    );
  }

  const pData = profile.profile_data;
  const columnsList = Object.entries(pData.columns);
  const numericCols = columnsList.filter(([_, data]) => ["Integer", "Float"].includes(data.inferred_type));
  const categoricalCols = columnsList.filter(([_, data]) => ["Category", "Text", "Boolean"].includes(data.inferred_type));
  const columnNames = Object.keys(pData.columns);

  if (!selectedCatCol && categoricalCols.length > 0) {
    setSelectedCatCol(categoricalCols[0][0]);
  }

  const selectedCatData = selectedCatCol ? pData.columns[selectedCatCol] : null;

  const mainTabs = [
    { id: 'overview', label: '01. Dossier Summary' },
    { id: 'columns', label: '02. Schema Dissection' },
    { id: 'numeric', label: '03. Numeric Ledger' },
    { id: 'categorical', label: '04. Categorical Ledger' },
    { id: 'charts', label: '05. Forensic Charts' },
    { id: 'ai', label: '06. AI Intelligence' },
    { id: 'code', label: '07. Code Studio' },
    { id: 'pipeline', label: '08. Lakehouse' },
  ] as const;

  const aiSubTabs: { key: typeof activeAITab; label: string; icon: React.ComponentType<any> }[] = [
    { key: 'summary', label: 'Executive Summary', icon: Brain },
    { key: 'quality', label: 'Quality Defects', icon: AlertCircle },
    { key: 'recommendations', label: 'Playbook', icon: Wrench },
    { key: 'column', label: 'Column Ledger', icon: BarChart3 },
    { key: 'chat', label: 'Investigator Terminal', icon: MessageSquare },
  ];

  return (
    <div className="space-y-8 py-2">
      {/* Dossier Header */}
      <div className="space-y-4">
        <Link href="/datasets" className="inline-flex items-center gap-2 text-xs font-mono text-paper-400 hover:text-paper-100 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>BACK TO CASE ARCHIVES</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ruling pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded bg-ink-800 border border-ruling flex items-center justify-center text-evidence-amber font-mono font-bold text-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xl sm:text-2xl font-bold uppercase text-paper-50 tracking-tight">
                  Case Dossier: {profile.dataset_id.slice(0, 12)}
                </h1>
                <span className={`stamp-tag ${
                  pData.health_score >= 85 ? 'stamp-tag-emerald' : pData.health_score >= 60 ? 'stamp-tag-amber' : 'stamp-tag-crimson'
                } text-[9px]`}>
                  {pData.health_score}% VERDICT
                </span>
              </div>
              <p className="text-[11px] font-mono text-paper-400 mt-0.5">
                RECORDED: {new Date(profile.created_at).toLocaleString()} • REGISTRY TAG #{profile.id.slice(0, 8)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forensic KPI Metric Badges */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono">
        <div className="ledger-card p-3.5 space-y-1">
          <span className="text-[9px] uppercase font-bold text-paper-400">Total Rows</span>
          <p className="text-xl font-bold text-paper-50">{pData?.total_rows?.toLocaleString() ?? '-'}</p>
        </div>
        <div className="ledger-card p-3.5 space-y-1">
          <span className="text-[9px] uppercase font-bold text-paper-400">Schemas Mapped</span>
          <p className="text-xl font-bold text-paper-50">{pData?.total_columns?.toLocaleString() ?? '-'}</p>
        </div>
        <div className="ledger-card p-3.5 space-y-1">
          <span className="text-[9px] uppercase font-bold text-evidence-amber">Null Cells</span>
          <p className="text-xl font-bold text-paper-50">{pData?.total_missing_values?.toLocaleString() ?? '-'}</p>
        </div>
        <div className="ledger-card p-3.5 space-y-1">
          <span className="text-[9px] uppercase font-bold text-paper-400">Memory Allocation</span>
          <p className="text-xl font-bold text-paper-50">{formatBytes(pData?.memory_usage_bytes)}</p>
        </div>
        <div className="ledger-card p-3.5 space-y-1">
          <span className="text-[9px] uppercase font-bold text-evidence-crimson">Outliers Flagged</span>
          <p className="text-xl font-bold text-paper-50">{pData?.total_outliers?.toLocaleString() ?? '-'}</p>
        </div>
      </div>

      {/* Main Investigation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Integrity Gauge Panel */}
        <section className="ledger-card p-5 flex flex-col justify-between space-y-6 font-mono">
          <div className="space-y-1 border-b border-ruling pb-3">
            <span className="text-[10px] font-bold uppercase text-evidence-amber">Forensic Health Verdict</span>
            <h3 className="text-sm font-bold text-paper-100">Weighted Quality Grade</h3>
          </div>
          
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <div className="text-4xl font-bold text-paper-50">
              {pData.health_score}<span className="text-base text-paper-400">/100</span>
            </div>

            {/* Segmented Forensic Gauge */}
            <div className="grid grid-cols-10 gap-1 w-full max-w-[220px] h-3">
              {[...Array(10)].map((_, i) => {
                const filled = (i + 1) * 10 <= pData.health_score;
                const color = pData.health_score >= 85 ? 'bg-evidence-emerald' : pData.health_score >= 60 ? 'bg-evidence-amber' : 'bg-evidence-crimson';
                return (
                  <div 
                    key={i} 
                    className={`h-full rounded-sm ${filled ? color : 'bg-ink-800'}`}
                  />
                );
              })}
            </div>
            
            <span className={`stamp-tag ${
              pData.health_score >= 85 ? 'stamp-tag-emerald' : pData.health_score >= 60 ? 'stamp-tag-amber' : 'stamp-tag-crimson'
            } text-[10px]`}>
              {pData.health_score >= 85 ? 'PASSING FORENSIC AUDIT' : pData.health_score >= 60 ? 'QUALITY DEFECTS NOTED' : 'CRITICAL REMEDIATION REQUIRED'}
            </span>
          </div>

          <div className="space-y-2 pt-3 border-t border-ruling">
            <span className="text-[10px] font-bold uppercase text-paper-400 block">Deductions Audit Checklist:</span>
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1 text-xs text-paper-300 font-body">
              {pData.health_breakdown.map((item, i) => (
                <div key={i} className="flex gap-2 items-start text-[11px]">
                  <span className="text-evidence-amber font-mono mt-0.5">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tabbed Investigation Panels */}
        <section className="lg:col-span-2 ledger-card p-5 flex flex-col justify-between space-y-6">
          {/* Dossier Tabs Navigation */}
          <div className="flex border-b border-ruling pb-2 items-center gap-1 overflow-x-auto font-mono text-xs">
            {mainTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded transition-all shrink-0 border ${
                  activeTab === tab.id 
                    ? 'bg-ink-800 text-paper-100 border-ruling font-bold' 
                    : 'text-paper-400 hover:text-paper-200 border-transparent hover:bg-ink-850'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-grow min-h-[360px]">
            {/* TAB: Dossier Summary */}
            {activeTab === 'overview' && (
              <div className="space-y-4 font-mono text-xs">
                <div className="border-b border-ruling pb-2">
                  <h3 className="font-bold text-paper-100 uppercase">Diagnostics Telemetry</h3>
                  <p className="text-[11px] text-paper-400 font-body">Core metrics covering schema parity, duplicate records, and memory partition.</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-ink-950 rounded border border-ruling space-y-1">
                    <span className="text-[10px] font-bold text-paper-400 uppercase">Duplicate Record Signatures</span>
                    <p className="text-lg font-bold text-paper-50">{pData?.total_duplicate_rows ?? 0}</p>
                    <p className="text-[10px] text-paper-400">RATIO: {pData?.duplicate_percentage?.toFixed(2) ?? 0}% of total table</p>
                  </div>
                  <div className="p-3.5 bg-ink-950 rounded border border-ruling space-y-1">
                    <span className="text-[10px] font-bold text-paper-400 uppercase">Outlier Boundary Infractions</span>
                    <p className="text-lg font-bold text-evidence-crimson">{pData?.total_outliers ?? 0}</p>
                    <p className="text-[10px] text-paper-400">THRESHOLD: 1.5× IQR calculation</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Schema Dissection Table */}
            {activeTab === 'columns' && (
              <div className="space-y-4 font-mono">
                <div className="border-b border-ruling pb-2">
                  <h3 className="text-xs font-bold text-paper-100 uppercase">Schema Dissection Table</h3>
                  <p className="text-[11px] text-paper-400 font-body">Column data type detection, null cell counts, and distinct value cardinality.</p>
                </div>

                <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                  <table className="forensic-table">
                    <thead>
                      <tr>
                        <th>Field Name</th>
                        <th>Type</th>
                        <th>Null Cells</th>
                        <th>Missing %</th>
                        <th>Distinct Values</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columnsList.map(([colName, colData]) => (
                        <tr key={colName}>
                          <td className="font-bold text-paper-100">{colName}</td>
                          <td>
                            <span className="stamp-tag stamp-tag-cyan text-[9px]">
                              {colData.inferred_type}
                            </span>
                          </td>
                          <td className={colData.null_count > 0 ? 'text-evidence-amber font-bold' : 'text-paper-400'}>
                            {colData.null_count}
                          </td>
                          <td>
                            <span className={colData.missing_percentage > 0 ? 'text-evidence-amber' : 'text-paper-400'}>
                              {colData.missing_percentage.toFixed(1)}%
                            </span>
                          </td>
                          <td className="text-paper-300">{colData.cardinality}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: Numeric Ledger */}
            {activeTab === 'numeric' && (
              <div className="space-y-4 font-mono">
                <div className="border-b border-ruling pb-2">
                  <h3 className="text-xs font-bold text-paper-100 uppercase">Numeric Field Statistics</h3>
                  <p className="text-[11px] text-paper-400 font-body">Statistical moments, quartiles, mean, stddev, and outlier counts.</p>
                </div>

                <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
                  <table className="forensic-table">
                    <thead>
                      <tr>
                        <th>Field</th>
                        <th>Min</th>
                        <th>Max</th>
                        <th>Mean</th>
                        <th>StdDev</th>
                        <th>Outliers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {numericCols.map(([colName, colData]) => (
                        <tr key={colName}>
                          <td className="font-bold text-paper-100">{colName}</td>
                          <td>{colData.min !== null && colData.min !== undefined ? colData.min : '-'}</td>
                          <td>{colData.max !== null && colData.max !== undefined ? colData.max : '-'}</td>
                          <td>{colData.mean !== null && colData.mean !== undefined ? Number(colData.mean).toFixed(2) : '-'}</td>
                          <td>{colData.std !== null && colData.std !== undefined ? Number(colData.std).toFixed(2) : '-'}</td>
                          <td className={colData.outlier_count > 0 ? 'text-evidence-crimson font-bold' : 'text-paper-400'}>
                            {colData.outlier_count || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: Categorical Ledger */}
            {activeTab === 'categorical' && (
              <div className="space-y-4 font-mono">
                <div className="border-b border-ruling pb-2">
                  <h3 className="text-xs font-bold text-paper-100 uppercase">Categorical Frequency Distribution</h3>
                  <p className="text-[11px] text-paper-400 font-body">Inspect unique categorical values and occurrence distributions.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                    {categoricalCols.map(([colName]) => (
                      <button
                        key={colName}
                        onClick={() => setSelectedCatCol(colName)}
                        className={`w-full text-left p-2 rounded text-xs border ${
                          selectedCatCol === colName 
                            ? 'bg-ink-800 border-evidence-amber text-paper-100 font-bold' 
                            : 'text-paper-400 border-transparent hover:bg-ink-850'
                        }`}
                      >
                        {colName}
                      </button>
                    ))}
                  </div>

                  <div className="md:col-span-2 p-4 bg-ink-950 rounded border border-ruling space-y-3">
                    {selectedCatData ? (
                      <>
                        <div className="flex items-center justify-between border-b border-ruling pb-2">
                          <span className="font-bold text-paper-100 text-xs">{selectedCatCol}</span>
                          <span className="text-[10px] text-paper-400">CARDINALITY: {selectedCatData.cardinality}</span>
                        </div>

                        <div className="space-y-2 max-h-[220px] overflow-y-auto">
                          {selectedCatData.top_categories?.map((cat: any, index: number) => {
                            const totalRows = pData?.total_rows ?? 0;
                            const percentage = totalRows > 0 && cat?.count ? ((cat.count / totalRows) * 100).toFixed(1) : '0.0';
                            return (
                              <div key={index} className="space-y-1">
                                <div className="flex justify-between text-[11px]">
                                  <span className="text-paper-200 truncate max-w-[160px]">{cat?.value ?? '-'}</span>
                                  <span className="text-paper-400">{cat?.count} ({percentage}%)</span>
                                </div>
                                <div className="w-full bg-ink-900 rounded h-1.5 overflow-hidden">
                                  <div className="bg-evidence-amber h-full" style={{ width: `${percentage}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-paper-400">Select a categorical field to view distribution breakdown.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Forensic Charts */}
            {activeTab === 'charts' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 font-mono">
                <div className="ledger-card p-4 space-y-2">
                  <span className="text-[10px] font-bold text-paper-400 uppercase block border-b border-ruling pb-1">
                    Null Values Count by Schema Field
                  </span>
                  <MissingValuesChart columnsData={pData.columns} />
                </div>
                <div className="ledger-card p-4 space-y-2">
                  <span className="text-[10px] font-bold text-paper-400 uppercase block border-b border-ruling pb-1">
                    Field Completeness Ratio (%)
                  </span>
                  <ColumnCompletenessChart columnsData={pData.columns} />
                </div>
              </div>
            )}

            {/* TAB: AI Intelligence */}
            {activeTab === 'ai' && (
              <div className="space-y-5 font-mono">
                <div className="flex gap-1.5 border-b border-ruling pb-2 overflow-x-auto">
                  {aiSubTabs.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveAITab(key)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs border ${
                        activeAITab === key 
                          ? 'bg-ink-800 text-paper-100 border-ruling font-bold' 
                          : 'text-paper-400 border-transparent hover:bg-ink-850'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-evidence-amber" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                <div>
                  {activeAITab === 'summary' && <AIOverviewSection datasetId={id} apiUrl={apiUrl} />}
                  {activeAITab === 'quality' && <AIQualitySection datasetId={id} apiUrl={apiUrl} />}
                  {activeAITab === 'recommendations' && <AIRecommendationsSection datasetId={id} apiUrl={apiUrl} />}
                  {activeAITab === 'column' && <AIColumnExplainerSection datasetId={id} apiUrl={apiUrl} columnNames={columnNames} />}
                  {activeAITab === 'chat' && <AIChatSection datasetId={id} apiUrl={apiUrl} />}
                </div>
              </div>
            )}

            {/* TAB: Code Studio */}
            {activeTab === 'code' && (
              <AICodeStudioSection datasetId={id} apiUrl={apiUrl} />
            )}

            {/* TAB: Data Pipeline */}
            {activeTab === 'pipeline' && (
              <DataPipelineSection datasetId={id} apiUrl={apiUrl} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
