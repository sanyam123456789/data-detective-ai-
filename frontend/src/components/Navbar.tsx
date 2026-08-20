'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Upload, Database, Sliders, Menu, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: '/dashboard', label: 'Dashboard', code: '01', icon: LayoutDashboard },
    { href: '/upload', label: 'Upload Data', code: '02', icon: Upload },
    { href: '/datasets', label: 'Datasets', code: '03', icon: Database },
    { href: '/settings', label: 'Settings', code: '04', icon: Sliders },
  ];

  return (
    <nav className="fixed top-7 left-0 right-0 z-40 bg-[#141013]/90 border-b border-[#382A34] backdrop-blur-md px-4 sm:px-8 py-2.5 flex items-center justify-between transition-all">
      {/* Brand & Logo */}
      <Link 
        href="/" 
        className="flex items-center gap-3 text-[#FAF5F6] hover:opacity-90 transition-opacity" 
        onClick={() => setMobileOpen(false)}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#C89D66] to-[#E08D9D] flex items-center justify-center text-[#141013] font-mono font-bold text-sm shadow-md shadow-[#C89D66]/20 border border-[#FAF5F6]/20">
          DD
        </div>
        <div className="flex flex-col">
          <div className="font-display font-bold text-sm tracking-tight flex items-center gap-1.5 uppercase text-[#FAF5F6]">
            <span>Data Detective</span>
            <span className="text-[10px] font-mono font-bold bg-[#E08D9D]/20 text-[#F7B7C4] px-1.5 py-0.2 rounded border border-[#E08D9D]/30">
              AI
            </span>
          </div>
          <span className="text-[9px] font-mono text-[#D6C7C2] tracking-wider font-medium">
            QUALITY & LAKEHOUSE PLATFORM
          </span>
        </div>
      </Link>

      {/* Desktop Navigation Links */}
      <div className="hidden md:flex items-center gap-1 bg-[#1F181D]/90 p-1 rounded-xl border border-[#382A34]">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <Link 
              key={link.href} 
              href={link.href} 
              className={`relative px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-2 ${
                isActive 
                  ? 'bg-[#C89D66] text-[#141013] font-bold border border-[#C89D66] shadow-sm shadow-[#C89D66]/20' 
                  : 'text-[#D6C7C2] hover:text-[#FAF5F6] hover:bg-[#2C2129]'
              }`}
            >
              <span className={`text-[10px] font-bold ${isActive ? 'text-[#141013]/70' : 'text-[#9E8B95]'}`}>{link.code}</span>
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#141013]' : 'text-[#E08D9D]'}`} />
              <span className="font-medium tracking-tight">{link.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#141013]" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Primary Action Button */}
      <div className="hidden md:flex items-center gap-3">
        <Link 
          href="/upload" 
          className="btn-primary text-xs flex items-center gap-1.5"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Dataset</span>
        </Link>
      </div>

      {/* Mobile Nav Toggle */}
      <button 
        type="button"
        aria-label="Toggle navigation menu"
        className="md:hidden text-[#D6C7C2] hover:text-white p-1.5 border border-[#382A34] rounded-lg bg-[#1F181D] cursor-pointer"
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
            className="absolute top-full left-0 right-0 bg-[#141013] border-b border-[#382A34] flex flex-col p-5 gap-2.5 md:hidden z-40 shadow-xl font-mono"
          >
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={`flex items-center justify-between p-2.5 rounded-lg text-xs border ${
                    isActive 
                      ? 'bg-[#C89D66] text-[#141013] border-[#C89D66] font-bold' 
                      : 'text-[#D6C7C2] hover:bg-[#1F181D] border-transparent'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[#9E8B95] font-bold">{link.code}</span>
                    <Icon className="w-4 h-4 text-[#E08D9D]" />
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
              <span>Upload Dataset</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
