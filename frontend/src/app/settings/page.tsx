'use client';

import React, { useState } from 'react';
import { User, Key, HardDrive, Save, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'api' | 'storage'>('profile');
  const [savedAlert, setSavedAlert] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Investigator Profile', code: '01', icon: User },
    { id: 'api', label: 'API & Vault Keys', code: '02', icon: Key },
    { id: 'storage', label: 'Lakehouse & S3 Storage', code: '03', icon: HardDrive },
  ] as const;

  const handleSave = () => {
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Bureau Config Header */}
      <div className="border-b border-ruling pb-4 space-y-1">
        <div className="flex items-center gap-2">
          <span className="stamp-tag stamp-tag-amber">BUREAU CONFIG</span>
          <span className="text-xs font-mono text-paper-400">CONFIG REF: #SEC-POL-04</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-paper-50">
          Bureau Configuration & Security Vault
        </h1>
        <p className="text-xs font-mono text-paper-400">
          MANAGE INVESTIGATOR CREDENTIALS, ACCESS TOKENS, AND CLUSTER STORAGE
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 flex flex-col gap-2 font-mono">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-between p-3 rounded text-xs text-left transition-all border ${
                  isActive 
                    ? 'bg-ink-800 text-paper-100 border-ruling font-bold' 
                    : 'text-paper-400 hover:bg-ink-850 border-transparent hover:text-paper-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-evidence-amber' : 'text-paper-400'}`} />
                  <span>{tab.label}</span>
                </div>
                <span className="text-[10px] text-ink-500">{tab.code}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <section className="md:col-span-3 ledger-card p-6 min-h-[360px] flex flex-col justify-between">
          <div className="space-y-6">
            {/* Tab: Investigator Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <div className="border-b border-ruling pb-2 flex items-center justify-between">
                  <h3 className="font-mono text-xs font-bold text-paper-100 uppercase">
                    Investigator Identification
                  </h3>
                  <span className="stamp-tag stamp-tag-muted text-[9px]">LEVEL 3 CLEARANCE</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-paper-400 font-bold uppercase tracking-wider block">
                      Investigator Name
                    </label>
                    <input 
                      type="text" 
                      defaultValue="Senior Forensic Data Engineer" 
                      className="w-full bg-ink-950 border border-ruling rounded px-3 py-2 text-xs text-paper-100 focus:border-evidence-amber"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-paper-400 font-bold uppercase tracking-wider block">
                      Bureau Email Docket
                    </label>
                    <input 
                      type="email" 
                      defaultValue="forensics@datadetective.ai" 
                      className="w-full bg-ink-950 border border-ruling rounded px-3 py-2 text-xs text-paper-100 focus:border-evidence-amber"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: API Credentials */}
            {activeTab === 'api' && (
              <div className="space-y-4 font-mono">
                <div className="border-b border-ruling pb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-paper-100 uppercase">
                    Forensic API Keys & Service Tokens
                  </h3>
                  <span className="stamp-tag stamp-tag-emerald text-[9px]">ACTIVE INGRESS</span>
                </div>

                <p className="text-xs text-paper-400 font-body leading-relaxed">
                  Use encrypted API keys to programmatically submit data specimens via Python CLI scripts or CI/CD pipelines.
                </p>

                <div className="p-3 bg-ink-950 rounded border border-ruling flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2 text-paper-200">
                    <Lock className="w-3.5 h-3.5 text-evidence-amber" />
                    <span>dd_live_• • • • • • • • • • • • • • 839d</span>
                  </div>
                  <span className="stamp-tag stamp-tag-emerald text-[9px]">
                    AUTHENTICATED
                  </span>
                </div>

                <button className="text-xs font-mono text-evidence-amber hover:underline flex items-center gap-1.5 pt-1">
                  <span>+ Generate New Forensic Key</span>
                </button>
              </div>
            )}

            {/* Tab: AWS Storage */}
            {activeTab === 'storage' && (
              <div className="space-y-4 font-mono">
                <div className="border-b border-ruling pb-2 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-paper-100 uppercase">
                    Lakehouse & AWS S3 Integration
                  </h3>
                  <span className="stamp-tag stamp-tag-cyan text-[9px]">S3 ENCLAVE</span>
                </div>

                <p className="text-xs text-paper-400 font-body leading-relaxed">
                  Data Detective AI defaults to local immutable filesystem storage. Configure environment variables in your server configuration to mount AWS S3 bucket partitions.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-paper-400 font-bold uppercase tracking-wider block">
                      Target S3 Bucket
                    </label>
                    <input 
                      type="text" 
                      placeholder="data-detective-ai-vault" 
                      disabled
                      className="w-full bg-ink-950 border border-ruling rounded px-3 py-2 text-xs text-paper-400 cursor-not-allowed opacity-70"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-paper-400 font-bold uppercase tracking-wider block">
                      AWS Region
                    </label>
                    <input 
                      type="text" 
                      placeholder="us-east-1" 
                      disabled
                      className="w-full bg-ink-950 border border-ruling rounded px-3 py-2 text-xs text-paper-400 cursor-not-allowed opacity-70"
                    />
                  </div>
                </div>

                <div className="p-3 bg-ink-950 rounded border border-ruling text-[11px] text-paper-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-evidence-amber shrink-0" />
                  <span>AWS credentials are loaded securely from active backend environment variables.</span>
                </div>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="pt-6 border-t border-ruling flex items-center justify-between">
            {savedAlert ? (
              <div className="text-xs font-mono text-evidence-emerald flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Configuration changes committed to ledger</span>
              </div>
            ) : <span />}

            <button 
              onClick={handleSave}
              className="btn-primary text-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Commit Config</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
