'use client';

import React, { useState } from 'react';
import { User, Key, HardDrive, Save, ShieldCheck, CheckCircle2, Lock, Cloud } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'api' | 'storage'>('profile');
  const [savedAlert, setSavedAlert] = useState(false);

  const tabs = [
    { id: 'profile', label: 'User Profile', code: '01', icon: User },
    { id: 'api', label: 'API Keys & Secrets', code: '02', icon: Key },
    { id: 'storage', label: 'AWS Lakehouse & S3', code: '03', icon: Cloud },
  ] as const;

  const handleSave = () => {
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Header */}
      <div className="border-b border-[#382A34] pb-4 space-y-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="stamp-tag stamp-tag-amber">CONFIGURATION</span>
          <span className="text-xs font-mono text-[#D6C7C2] font-medium">SETTINGS & CREDENTIALS</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#FAF5F6]">
          System Settings & Cloud Configuration
        </h1>
        <p className="text-xs font-mono text-[#D6C7C2]">
          MANAGE USER CREDENTIALS, ACCESS TOKENS, AND AWS S3 STORAGE ENCLAVES
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 flex flex-col gap-1.5 font-mono">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-between p-3 rounded-xl text-xs text-left transition-all border cursor-pointer ${
                  isActive 
                    ? 'bg-[#C89D66] text-[#141013] border-[#C89D66] font-bold shadow-sm' 
                    : 'text-[#D6C7C2] hover:bg-[#261E24] border-transparent hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#141013]' : 'text-[#E08D9D]'}`} />
                  <span>{tab.label}</span>
                </div>
                <span className={`text-[10px] ${isActive ? 'text-[#141013]/70 font-bold' : 'text-[#9E8B95]'}`}>{tab.code}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <section className="md:col-span-3 ledger-card p-6 min-h-[360px] flex flex-col justify-between">
          <div className="space-y-6">
            {/* Tab: User Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="border-b border-[#382A34] pb-2 flex items-center justify-between">
                  <h3 className="font-mono text-xs font-bold text-[#FAF5F6] uppercase">
                    User Identification
                  </h3>
                  <span className="stamp-tag stamp-tag-muted text-[9px]">DATA ENGINEER</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#D6C7C2] font-bold uppercase tracking-wider block">
                      Engineer Name
                    </label>
                    <input 
                      type="text" 
                      defaultValue="Senior Data Engineer" 
                      className="w-full bg-[#141013] border border-[#382A34] rounded-lg px-3 py-2 text-xs text-[#FAF5F6] focus:border-[#C89D66]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#D6C7C2] font-bold uppercase tracking-wider block">
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      defaultValue="engineer@datadetective.ai" 
                      className="w-full bg-[#141013] border border-[#382A34] rounded-lg px-3 py-2 text-xs text-[#FAF5F6] focus:border-[#C89D66]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: API Credentials */}
            {activeTab === 'api' && (
              <div className="space-y-4 font-mono">
                <div className="border-b border-[#382A34] pb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#FAF5F6] uppercase">
                    API Keys & Access Tokens
                  </h3>
                  <span className="stamp-tag stamp-tag-emerald text-[9px]">AUTHENTICATED</span>
                </div>

                <p className="text-xs text-[#D6C7C2] font-sans leading-relaxed">
                  Use API keys to programmatically submit datasets via Python SDK scripts, Airflow DAGs, or CI/CD pipelines.
                </p>

                <div className="p-3 bg-[#141013] rounded-lg border border-[#382A34] flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2 text-[#FAF5F6]">
                    <Lock className="w-3.5 h-3.5 text-[#C89D66]" />
                    <span>dd_live_• • • • • • • • • • • • • • 839d</span>
                  </div>
                  <span className="stamp-tag stamp-tag-emerald text-[9px]">
                    ACTIVE
                  </span>
                </div>

                <button type="button" className="text-xs font-mono text-[#C89D66] hover:underline flex items-center gap-1.5 pt-1 font-semibold cursor-pointer">
                  <span>+ Generate New API Key</span>
                </button>
              </div>
            )}

            {/* Tab: AWS Storage */}
            {activeTab === 'storage' && (
              <div className="space-y-4 font-mono">
                <div className="border-b border-[#382A34] pb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-[#FAF5F6] uppercase">
                    AWS Lakehouse & S3 Storage
                  </h3>
                  <span className="stamp-tag stamp-tag-cyan text-[9px]">S3 ENCLAVE</span>
                </div>

                <p className="text-xs text-[#D6C7C2] font-sans leading-relaxed">
                  Data Detective AI partitions and normalizes data directly into AWS S3 Parquet and AWS Glue Data Catalog.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#D6C7C2] font-bold uppercase tracking-wider block">
                      Target S3 Bucket
                    </label>
                    <input 
                      type="text" 
                      defaultValue="data-detective-ai-2026"
                      disabled
                      className="w-full bg-[#141013] border border-[#382A34] rounded-lg px-3 py-2 text-xs text-[#D6C7C2] cursor-not-allowed opacity-80"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-[#D6C7C2] font-bold uppercase tracking-wider block">
                      AWS Region
                    </label>
                    <input 
                      type="text" 
                      defaultValue="ap-south-1"
                      disabled
                      className="w-full bg-[#141013] border border-[#382A34] rounded-lg px-3 py-2 text-xs text-[#D6C7C2] cursor-not-allowed opacity-80"
                    />
                  </div>
                </div>

                <div className="p-3 bg-[#141013] rounded-lg border border-[#382A34] text-[11px] text-[#D6C7C2] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#5FA788] shrink-0" />
                  <span>AWS credentials are loaded securely from active backend environment variables and AWS profile.</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="pt-6 border-t border-[#382A34] flex items-center justify-between">
            {savedAlert ? (
              <div className="text-xs font-mono text-[#5FA788] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Configuration changes saved successfully</span>
              </div>
            ) : <span />}

            <button 
              type="button"
              onClick={handleSave}
              className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Configuration</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
