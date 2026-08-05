'use client';

import React, { useState } from 'react';
import { User, Key, HardDrive, Save } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'api' | 'storage'>('profile');

  const tabs = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'api', label: 'API Credentials', icon: Key },
    { id: 'storage', label: 'AWS & Storage', icon: HardDrive },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">System Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Configure profile details, integrations, and storage destinations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 flex flex-col gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 p-3 rounded-lg text-sm text-left transition-all ${
                  isActive 
                    ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20 font-semibold' 
                    : 'text-gray-400 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4 text-violet-400" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <section className="md:col-span-3 glass-card p-6 min-h-[350px] flex flex-col justify-between">
          <div className="space-y-6">
            {/* Tab: Profile */}
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">User Profile</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      defaultValue="Senior Data Engineer" 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Email Address</label>
                    <input 
                      type="email" 
                      defaultValue="engineer@datadetective.ai" 
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: API Credentials */}
            {activeTab === 'api' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">API Keys & Tokens</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Use API keys to programmatically upload datasets from CLI scripts or automated pipelines.
                </p>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between gap-4">
                    <div className="font-mono text-xs text-gray-300">
                      det_live_••••••••••••••••••••839d
                    </div>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-2 py-0.5 rounded-full font-bold">
                      ACTIVE
                    </span>
                  </div>
                  <button className="text-xs text-violet-400 hover:text-violet-300 font-semibold">
                    + Generate New API Key
                  </button>
                </div>
              </div>
            )}

            {/* Tab: AWS Storage */}
            {activeTab === 'storage' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">AWS Integration</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Data Detective AI handles local filesystem storage fallback out-of-the-box. To link production AWS S3 buckets, configure target variables in your environment file.
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">S3 Bucket Name</label>
                      <input 
                        type="text" 
                        placeholder="data-detective-ai-uploads" 
                        disabled
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">AWS Region</label>
                      <input 
                        type="text" 
                        placeholder="us-east-1" 
                        disabled
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-violet-400/70 italic">
                    💡 AWS details are loaded securely from application env files at launch. Fields are read-only here.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-white/5 flex justify-end">
            <button className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md">
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
