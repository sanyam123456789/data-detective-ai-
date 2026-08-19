'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Search, 
  ShieldAlert, 
  Database, 
  Cpu, 
  Terminal, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  FileSearch,
  Sparkles
} from 'lucide-react';

export default function Home() {
  const investigationSteps = [
    {
      code: '01',
      title: 'Chain-of-Custody Ingestion',
      stamp: 'INGESTION',
      description: 'Upload CSV or Excel data. Immediate SHA checksum verification and secure storage mapping to local or AWS S3 buckets.'
    },
    {
      code: '02',
      title: 'Forensic Anomaly Interception',
      stamp: 'AUDIT',
      description: 'Calculates IQR outlier boundaries, detects type mismatches, and flags corrupted timestamps with row-level precision.'
    },
    {
      code: '03',
      title: 'AI Detective Intelligence',
      stamp: 'DIAGNOSIS',
      description: 'Produces natural-language root-cause assessments, data quality risk scores, and actionable remediation instructions.'
    },
    {
      code: '04',
      title: 'Forensic Code & Pipeline Studio',
      stamp: 'REMEDIATION',
      description: 'Exports certified SQL cleaning queries and production-grade PySpark transformation pipelines directly to your lakehouse.'
    }
  ];

  return (
    <div className="space-y-16 py-4">
      {/* Hero Dossier Header */}
      <section className="ledger-card p-6 md:p-12 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-ruling pb-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="stamp-tag stamp-tag-amber">CASE FILE: ACTIVE</span>
            <span className="text-xs font-mono text-paper-400">INDEX: #FORENSIC-AI-2026</span>
          </div>
          <span className="text-xs font-mono text-paper-400 hidden sm:inline">
            CLASSIFICATION: RESTRICTED DATA AUDIT
          </span>
        </div>

        <div className="max-w-3xl space-y-6">
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-paper-50 uppercase leading-none">
            Investigate Data.<br />
            Surface Anomalies.<br />
            <span className="text-evidence-amber">Present Evidence.</span>
          </h1>

          <p className="text-base sm:text-lg text-paper-300 leading-relaxed font-body">
            An autonomous data forensics ledger built for modern data engineering teams. 
            Dissect complex tables, audit schema drift, pinpoint statistical anomalies, and generate clean SQL pipelines with forensic rigor.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
            <Link 
              id="hero-intake-btn"
              href="/upload" 
              className="btn-primary py-3 px-6 text-sm"
            >
              <span>Open New Case File</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              id="hero-board-btn"
              href="/dashboard" 
              className="btn-secondary py-3 px-6 text-sm"
            >
              <FileSearch className="w-4 h-4 text-paper-400" />
              <span>Inspect Active Ledger</span>
            </Link>
          </div>
        </div>

        {/* Tactical Docket Badge */}
        <div className="mt-10 pt-6 border-t border-ruling flex flex-wrap items-center gap-6 text-xs font-mono text-paper-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-evidence-emerald" />
            <span>FASTAPI ENGINE: ONLINE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-evidence-cyan" />
            <span>AI SYNTHESIS: ACTIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-evidence-amber" />
            <span>LAKEHOUSE PIPELINES: READY</span>
          </div>
        </div>
      </section>

      {/* Live Investigation Board Preview Simulator */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-paper-300">
            <span className="text-evidence-amber">■</span>
            <span className="font-bold uppercase tracking-wider">Forensic Evidence Ledger — Specimen 089</span>
          </div>
          <span className="stamp-tag stamp-tag-muted text-[10px]">LIVE WORKBENCH PREVIEW</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Anomaly Flag Log */}
          <div className="ledger-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-ruling pb-2">
              <span className="font-mono text-xs font-bold text-paper-200 uppercase">
                [FLAG #089-A] Anomalies Intercepted
              </span>
              <span className="stamp-tag stamp-tag-crimson text-[9px]">CRITICAL</span>
            </div>
            
            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-2.5 bg-ink-850 rounded border border-ruling flex items-start justify-between gap-3">
                <div>
                  <div className="text-paper-100 font-bold">outlier_fare_amount</div>
                  <div className="text-paper-400 text-[11px] mt-0.5">Value $9,450.00 &gt; 4.5x IQR boundary</div>
                </div>
                <span className="stamp-tag stamp-tag-crimson text-[9px]">42 ROWS</span>
              </div>

              <div className="p-2.5 bg-ink-850 rounded border border-ruling flex items-start justify-between gap-3">
                <div>
                  <div className="text-paper-100 font-bold">vendor_id_nulls</div>
                  <div className="text-paper-400 text-[11px] mt-0.5">Missing foreign key in critical transaction index</div>
                </div>
                <span className="stamp-tag stamp-tag-amber text-[9px]">1.8% NULL</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-paper-400 flex items-center gap-1.5 pt-1">
              <ShieldAlert className="w-3.5 h-3.5 text-evidence-crimson" />
              <span>Chain of custody intact. Quarantine suggested.</span>
            </div>
          </div>

          {/* Card 2: Integrity Meter & Diagnostic Gauge */}
          <div className="ledger-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-ruling pb-2">
              <span className="font-mono text-xs font-bold text-paper-200 uppercase">
                [INDEX #089-B] Quality Health Gauge
              </span>
              <span className="stamp-tag stamp-tag-emerald text-[9px]">VERIFIED</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-mono font-bold text-paper-50">91.4%</span>
                <span className="text-xs font-mono text-evidence-emerald">PASSING AUDIT</span>
              </div>

              {/* Forensic Gauge Segments */}
              <div className="grid grid-cols-10 gap-1 h-3">
                {[...Array(10)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-full rounded-sm ${i < 9 ? 'bg-evidence-emerald' : 'bg-ink-700'}`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-ruling">
                <div>
                  <span className="text-paper-400 text-[10px] block">TOTAL ROWS</span>
                  <span className="font-bold text-paper-100">1,420,890</span>
                </div>
                <div>
                  <span className="text-paper-400 text-[10px] block">SCHEMAS MAPPED</span>
                  <span className="font-bold text-paper-100">28 COLUMNS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Forensic Remediation Preview */}
          <div className="ledger-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-ruling pb-2">
              <span className="font-mono text-xs font-bold text-paper-200 uppercase">
                [OUTPUT #089-C] Generated SQL Cleanse
              </span>
              <span className="stamp-tag stamp-tag-cyan text-[9px]">SQL ARTIFACT</span>
            </div>

            <div className="p-3 bg-ink-950 rounded border border-ruling font-mono text-[11px] text-paper-200 overflow-x-auto">
              <span className="text-evidence-amber">SELECT</span> * <span className="text-evidence-amber">FROM</span> raw_intake<br />
              <span className="text-evidence-amber">WHERE</span> fare_amount <span className="text-evidence-cyan">BETWEEN</span> 0.50 <span className="text-evidence-cyan">AND</span> 500.00<br />
              &nbsp;&nbsp;<span className="text-evidence-amber">AND</span> vendor_id <span className="text-evidence-crimson">IS NOT NULL</span>;
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-paper-400">
              <span>DIALECT: ANSI SQL / DUCKDB</span>
              <span className="text-evidence-amber hover:underline cursor-pointer">EXPORT CODE &rarr;</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars of Forensic Investigation */}
      <section className="space-y-6">
        <div className="border-b border-ruling pb-3">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-paper-50">
            Forensic Investigation Protocols
          </h2>
          <p className="text-xs font-mono text-paper-400 mt-1">
            METHODOLOGY AND AUTOMATION ENGINES
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {investigationSteps.map((step) => (
            <div key={step.code} className="ledger-card p-6 flex flex-col justify-between gap-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-mono font-bold text-evidence-amber">{step.code}</span>
                  <span className="stamp-tag stamp-tag-muted text-[9px]">{step.stamp}</span>
                </div>
                <h3 className="font-display text-base font-bold text-paper-100 uppercase">
                  {step.title}
                </h3>
                <p className="text-xs text-paper-400 leading-relaxed font-body">
                  {step.description}
                </p>
              </div>

              <div className="pt-3 border-t border-ruling font-mono text-[10px] text-paper-400 flex items-center justify-between">
                <span>STATUS: OPERATIONAL</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-evidence-emerald" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Docket */}
      <section className="ledger-card p-8 md:p-12 text-center space-y-6 bg-ink-850">
        <div className="inline-flex items-center gap-2 stamp-tag stamp-tag-amber">
          <Sparkles className="w-3.5 h-3.5" />
          <span>READY FOR INTAKE</span>
        </div>
        
        <h2 className="font-display text-2xl sm:text-4xl font-bold uppercase text-paper-50 max-w-2xl mx-auto">
          Begin Ingesting & Auditing Data Evidence Today
        </h2>

        <p className="text-xs sm:text-sm font-body text-paper-300 max-w-xl mx-auto">
          Upload any structured CSV or Excel dataset to generate comprehensive profiling metrics, detect hidden quality defects, and produce verified data pipelines.
        </p>

        <div className="pt-2">
          <Link 
            id="cta-intake-bottom"
            href="/upload" 
            className="btn-primary text-sm py-3 px-8 inline-flex"
          >
            <span>Launch Case Intake</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
