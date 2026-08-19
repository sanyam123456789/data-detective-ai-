'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderGit2, Upload, Database, Sliders, Menu, X, ShieldAlert, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: '/dashboard', label: 'Investigation Board', code: '01', icon: FolderGit2 },
    { href: '/upload', label: 'Ingest Evidence', code: '02', icon: Upload },
    { href: '/datasets', label: 'Case Archives', code: '03', icon: Database },
    { href: '/settings', label: 'Bureau Config', code: '04', icon: Sliders },
  ];

  return (
    <nav className="fixed top-6 left-0 right-0 z-40 bg-ink-900/95 border-b border-ruling backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between transition-all">
      {/* Brand & Forensic Tag */}
      <Link 
        href="/" 
        className="flex items-center gap-3 text-paper-100 hover:opacity-90 transition-opacity" 
        onClick={() => setMobileOpen(false)}
      >
        <div className="w-8 h-8 rounded bg-ink-800 border border-ruling flex items-center justify-center text-evidence-amber font-mono font-bold text-sm shadow-sm">
          DD
        </div>
        <div className="flex flex-col">
          <div className="font-display font-bold text-sm tracking-wide flex items-center gap-1.5 uppercase">
            <span>Data Detective</span>
            <span className="text-[10px] font-mono font-bold bg-evidence-amber text-ink-950 px-1 py-0.2 rounded">
              AI
            </span>
          </div>
          <span className="text-[10px] font-mono text-paper-400 tracking-wider">
            EVIDENCE & AUDIT LEDGER
          </span>
        </div>
      </Link>

      {/* Desktop Navigation Dossier Tabs */}
      <div className="hidden md:flex items-center gap-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <Link 
              key={link.href} 
              href={link.href} 
              className={`relative px-3.5 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-2 border ${
                isActive 
                  ? 'bg-ink-800 text-paper-100 border-ruling shadow-sm' 
                  : 'text-paper-400 hover:text-paper-200 hover:bg-ink-850 border-transparent'
              }`}
            >
              <span className="text-[10px] text-ink-500 font-bold">{link.code}</span>
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-evidence-amber' : 'text-paper-400'}`} />
              <span className="font-medium tracking-tight">{link.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-evidence-amber" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Primary Action Button */}
      <div className="hidden md:flex items-center gap-3">
        <Link 
          href="/upload" 
          className="btn-primary text-xs"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>New Case Intake</span>
        </Link>
      </div>

      {/* Mobile Nav Toggle */}
      <button 
        aria-label="Toggle navigation menu"
        className="md:hidden text-paper-400 hover:text-paper-100 p-1.5 border border-ruling rounded bg-ink-850"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 bg-ink-950 border-b border-ruling flex flex-col p-5 gap-3 md:hidden z-40 shadow-xl font-mono"
          >
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={`flex items-center justify-between p-2.5 rounded text-xs border ${
                    isActive 
                      ? 'bg-ink-800 text-paper-100 border-ruling' 
                      : 'text-paper-400 hover:bg-ink-850 border-transparent'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-ink-500 font-bold">{link.code}</span>
                    <Icon className="w-4 h-4 text-evidence-amber" />
                    <span>{link.label}</span>
                  </div>
                  {isActive && <span className="text-[10px] stamp-tag stamp-tag-amber">ACTIVE</span>}
                </Link>
              );
            })}
            <Link 
              href="/upload" 
              className="btn-primary mt-2 justify-center"
              onClick={() => setMobileOpen(false)}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>New Case Intake</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
