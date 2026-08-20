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
  Sparkles,
  Zap,
  Check,
  Cloud,
  Brain,
  BarChart3
} from 'lucide-react';

export default function Home() {
  const platformPillars = [
    {
      code: '01',
      title: 'Automated Profiling & Schema Detection',
      stamp: 'INGESTION',
      description: 'Upload CSV or Excel data. Immediate SHA checksum verification and automated data type & statistical inference.',
      icon: Database,
    },
    {
      code: '02',
      title: 'Data Quality & Outlier Detection',
      stamp: 'QUALITY ENGINE',
      description: 'Calculates IQR outlier boundaries, Z-scores, detects format anomalies, and flags missing values with cell-level precision.',
      icon: ShieldAlert,
    },
    {
      code: '03',
      title: 'AI Intelligence & Copilot',
      stamp: 'AI COPILOT',
      description: 'Produces natural-language summaries, root-cause assessments, data quality risk scores, and actionable remediation plans.',
      icon: Brain,
    },
    {
      code: '04',
      title: 'AWS Lakehouse & Athena Pipelines',
      stamp: 'LAKEHOUSE',
      description: 'Automatically curates data to AWS S3, catalogs tables in AWS Glue, and queries datasets with live Amazon Athena SQL.',
      icon: Cloud,
    }
  ];

  return (
    <div className="space-y-16 py-4">
      {/* Hero Header */}
      <section className="ledger-card p-6 md:p-12 relative overflow-hidden bg-[#1F181D] border-[#382A34] shadow-xl">
        <div className="flex items-center justify-between border-b border-[#382A34] pb-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="stamp-tag stamp-tag-amber">PLATFORM: ACTIVE</span>
            <span className="text-xs font-mono text-[#D6C7C2]">CORE: v2.4 DATASET INTELLIGENCE</span>
          </div>
          <span className="text-xs font-mono text-[#D6C7C2] hidden sm:inline font-medium">
            AWS LAKEHOUSE & FASTAPI ENGINE
          </span>
        </div>

        <div className="max-w-3xl space-y-6">
          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#FAF5F6] uppercase leading-tight">
            Audit Data Quality.<br />
            Detect Anomalies.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C89D66] via-[#E08D9D] to-[#F7B7C4]">
              Query Lakehouse with AI.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#D6C7C2] leading-relaxed font-body">
            An autonomous data quality intelligence platform built for modern data teams. 
            Dissect complex tables, audit schema drift, pinpoint statistical outliers, and execute Athena SQL queries with AI precision.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
            <Link 
              id="hero-intake-btn"
              href="/upload" 
              className="btn-primary py-3 px-6 text-sm flex items-center justify-center gap-2"
            >
              <span>Upload Dataset</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              id="hero-board-btn"
              href="/dashboard" 
              className="btn-secondary py-3 px-6 text-sm flex items-center justify-center gap-2"
            >
              <BarChart3 className="w-4 h-4 text-[#C89D66]" />
              <span>Explore Dashboard</span>
            </Link>
          </div>
        </div>

        {/* Engine Status Badges */}
        <div className="mt-10 pt-6 border-t border-[#382A34] flex flex-wrap items-center gap-6 text-xs font-mono text-[#D6C7C2]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#5FA788]" />
            <span>FASTAPI ENGINE: ONLINE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E08D9D]" />
            <span>GEMINI 2.0 FLASH: ACTIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C89D66]" />
            <span>AWS ATHENA & S3: READY</span>
          </div>
        </div>
      </section>

      {/* Live System Preview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-xs text-[#FAF5F6]">
            <span className="text-[#C89D66]">■</span>
            <span className="font-bold uppercase tracking-wider">Live Telemetry Specimen — Specimen #089</span>
          </div>
          <span className="stamp-tag stamp-tag-cyan text-[10px]">LIVE WORKSPACE PREVIEW</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card 1: Anomaly Flag Log */}
          <div className="ledger-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#382A34] pb-2">
              <span className="font-mono text-xs font-bold text-[#FAF5F6] uppercase">
                [FLAG #089-A] Anomalies Detected
              </span>
              <span className="stamp-tag stamp-tag-crimson text-[9px]">CRITICAL</span>
            </div>
            
            <div className="space-y-2.5 font-mono text-xs">
              <div className="p-3 bg-[#181216] rounded-lg border border-[#382A34] flex items-start justify-between gap-3">
                <div>
                  <div className="text-[#FAF5F6] font-bold">outlier_fare_amount</div>
                  <div className="text-[#D6C7C2] text-[11px] mt-0.5">Value $9,450.00 &gt; 4.5x IQR boundary</div>
                </div>
                <span className="stamp-tag stamp-tag-crimson text-[9px]">42 ROWS</span>
              </div>

              <div className="p-3 bg-[#181216] rounded-lg border border-[#382A34] flex items-start justify-between gap-3">
                <div>
                  <div className="text-[#FAF5F6] font-bold">vendor_id_nulls</div>
                  <div className="text-[#D6C7C2] text-[11px] mt-0.5">Missing foreign key in critical transaction index</div>
                </div>
                <span className="stamp-tag stamp-tag-amber text-[9px]">1.8% NULL</span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-[#D6C7C2] flex items-center gap-1.5 pt-1">
              <ShieldAlert className="w-3.5 h-3.5 text-[#D96B60]" />
              <span>Statistical isolation & quarantine recommended.</span>
            </div>
          </div>

          {/* Card 2: Integrity Meter & Diagnostic Gauge */}
          <div className="ledger-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#382A34] pb-2">
              <span className="font-mono text-xs font-bold text-[#FAF5F6] uppercase">
                [INDEX #089-B] Quality Health Gauge
              </span>
              <span className="stamp-tag stamp-tag-emerald text-[9px]">VERIFIED</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-mono font-bold text-[#FAF5F6]">91.4%</span>
                <span className="text-xs font-mono font-semibold text-[#88D4B4]">PASSING AUDIT</span>
              </div>

              {/* Gauge Segments */}
              <div className="grid grid-cols-10 gap-1.5 h-3">
                {[...Array(10)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-full rounded-sm ${i < 9 ? 'bg-[#5FA788] shadow-xs shadow-[#5FA788]/50' : 'bg-[#2C2129]'}`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-3 border-t border-[#382A34]">
                <div>
                  <span className="text-[#D6C7C2] text-[10px] block">TOTAL ROWS</span>
                  <span className="font-bold text-[#FAF5F6]">1,420,890</span>
                </div>
                <div>
                  <span className="text-[#D6C7C2] text-[10px] block">COLUMNS MAPPED</span>
                  <span className="font-bold text-[#FAF5F6]">28 FIELDS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Athena SQL Preview */}
          <div className="ledger-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#382A34] pb-2">
              <span className="font-mono text-xs font-bold text-[#FAF5F6] uppercase">
                [OUTPUT #089-C] Generated SQL Cleanse
              </span>
              <span className="stamp-tag stamp-tag-cyan text-[9px]">SQL ARTIFACT</span>
            </div>

            <div className="p-3 bg-[#100C0F] rounded-lg border border-[#382A34] font-mono text-[11px] text-[#FAF5F6] overflow-x-auto">
              <span className="text-[#C89D66]">SELECT</span> * <span className="text-[#C89D66]">FROM</span> raw_intake<br />
              <span className="text-[#C89D66]">WHERE</span> fare_amount <span className="text-[#E08D9D]">BETWEEN</span> 0.50 <span className="text-[#E08D9D]">AND</span> 500.00<br />
              &nbsp;&nbsp;<span className="text-[#C89D66]">AND</span> vendor_id <span className="text-[#D96B60]">IS NOT NULL</span>;
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-[#D6C7C2]">
              <span>DIALECT: ANSI SQL / ATHENA</span>
              <span className="text-[#C89D66] font-semibold hover:underline cursor-pointer">EXPORT CODE &rarr;</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars */}
      <section className="space-y-6">
        <div className="border-b border-[#382A34] pb-3">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-[#FAF5F6]">
            Platform Capabilities & Architecture
          </h2>
          <p className="text-xs font-mono text-[#D6C7C2] mt-1">
            END-TO-END DATA ENGINEERING & QUALITY AUTOMATION
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {platformPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div key={pillar.code} className="ledger-card p-6 flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-mono font-bold text-[#C89D66]">{pillar.code}</span>
                    <span className="stamp-tag stamp-tag-muted text-[9px]">{pillar.stamp}</span>
                  </div>
                  <h3 className="font-display text-base font-bold text-[#FAF5F6] uppercase">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-[#D6C7C2] leading-relaxed font-body">
                    {pillar.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#382A34] font-mono text-[10px] text-[#D6C7C2] flex items-center justify-between">
                  <span>STATUS: OPERATIONAL</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#88D4B4]" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Call to Action */}
      <section className="ledger-card p-8 md:p-12 text-center space-y-6 bg-gradient-to-b from-[#1F181D] to-[#181216] border-[#382A34]">
        <div className="inline-flex items-center gap-2 stamp-tag stamp-tag-amber">
          <Sparkles className="w-3.5 h-3.5" />
          <span>READY TO AUDIT</span>
        </div>
        
        <h2 className="font-display text-2xl sm:text-4xl font-bold uppercase text-[#FAF5F6] max-w-2xl mx-auto">
          Start Auditing Your Data Quality Today
        </h2>

        <p className="text-xs sm:text-sm font-body text-[#D6C7C2] max-w-xl mx-auto">
          Upload any CSV or Excel dataset to generate comprehensive profiling metrics, detect hidden quality defects, and produce verified AWS lakehouse pipelines.
        </p>

        <div className="pt-2">
          <Link 
            id="cta-intake-bottom"
            href="/upload" 
            className="btn-primary text-sm py-3 px-8 inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Upload Dataset Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
