'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Cpu, BarChart3, Database, ShieldAlert, Sparkles, Code2 } from 'lucide-react';

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
  };

  const features = [
    {
      icon: Database,
      title: 'Automated Profiling',
      description: 'Instant schema discovery, statistics, cardinality, and null counts for your dataset.'
    },
    {
      icon: ShieldAlert,
      title: 'Quality Detection',
      description: 'Pinpoint duplicate rows, outliers, type anomalies, and formatting bugs automatically.'
    },
    {
      icon: Sparkles,
      title: 'AI Insights',
      description: 'Receive natural language explanations of data patterns and potential quality problems.'
    },
    {
      icon: Code2,
      title: 'Code Generation',
      description: 'Export structured clean SQL queries or optimized PySpark transformation scripts.'
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      {/* Hero Section */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto space-y-8 py-12 md:py-20"
      >
        <motion.div 
          variants={itemVariants}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-300 tracking-wide"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Next-Generation Data Profiler</span>
        </motion.div>
        
        <motion.h1 
          variants={itemVariants}
          className="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent"
        >
          Upload Data. Discover Insights.<br />
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Engineer Smarter.
          </span>
        </motion.h1>

        <motion.p 
          variants={itemVariants}
          className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed"
        >
          Streamline your data analytics. Upload CSV or Excel datasets to automatically profile distributions, resolve quality gaps, and generate production-grade pipelines.
        </motion.p>

        <motion.div 
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link 
            id="cta-get-started"
            href="/upload" 
            className="w-full sm:w-auto px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
          >
            <span>Upload Dataset</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link 
            id="cta-view-dashboard"
            href="/dashboard" 
            className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-semibold transition-all hover:scale-105 flex items-center justify-center gap-2"
          >
            <span>View Dashboard</span>
          </Link>
        </motion.div>
      </motion.div>

      {/* Feature Cards Grid */}
      <section className="w-full py-16 border-t border-white/5 mt-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-12 text-white">Engineered for Modern Data Teams</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, type: 'spring' }}
                className="glass-card p-6 flex flex-col items-start text-left gap-4"
              >
                <div className="p-3 bg-violet-500/10 rounded-xl text-violet-400 border border-violet-500/15">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Architecture Preview Section */}
      <section className="w-full py-16 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Platform Architecture</h2>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">
            Data Detective AI orchestrates ingestion and generation processes in a completely decoupled, serverless-ready network structure.
          </p>

          <div className="glass-card p-8 md:p-12 mt-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-indigo-500/5 pointer-events-none" />
            
            {/* Box 1: Raw Ingestion */}
            <div className="flex flex-col items-center gap-2 z-10 w-full md:w-1/3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Database className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white text-sm">Raw Data Ingestion</h4>
              <p className="text-xs text-gray-400">CSV / Excel files uploads to highly secure, private S3 Buckets.</p>
            </div>

            {/* Arrow/Line */}
            <div className="hidden md:flex flex-col items-center text-violet-500/40 w-12 font-bold text-lg">
              ➔
            </div>

            {/* Box 2: Detective Engine */}
            <div className="flex flex-col items-center gap-2 z-10 w-full md:w-1/3">
              <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/25 animate-pulse">
                <Cpu className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-white text-sm">FastAPI Processing Engine</h4>
              <p className="text-xs text-gray-400">Pydantic verification layer matching serverless Lambda configurations.</p>
            </div>

            {/* Arrow/Line */}
            <div className="hidden md:flex flex-col items-center text-violet-500/40 w-12 font-bold text-lg">
              ➔
            </div>

            {/* Box 3: Downstream Assets */}
            <div className="flex flex-col items-center gap-2 z-10 w-full md:w-1/3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-white text-sm">Actionable Code & UI</h4>
              <p className="text-xs text-gray-400">Interactive quality profiling dashboards and target PySpark pipelines.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
