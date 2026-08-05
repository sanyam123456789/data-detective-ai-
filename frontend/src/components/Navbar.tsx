'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Terminal, LayoutDashboard, UploadCloud, Database, Settings, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/upload', label: 'Upload', icon: UploadCloud },
    { href: '/datasets', label: 'Datasets', icon: Database },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2 text-white font-semibold tracking-wider hover:opacity-95 transition-opacity" onClick={() => setMobileOpen(false)}>
        <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Terminal className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold tracking-tight text-white">
          Data Detective <span className="text-violet-400 font-bold">AI</span>
        </span>
      </Link>

      {/* Desktop Nav */}
      <div className="hidden md:flex items-center gap-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} className="relative px-4 py-2 rounded-lg text-sm transition-colors text-gray-400 hover:text-white flex items-center gap-2">
              {isActive && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute inset-0 bg-white/5 rounded-lg border border-white/10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon className="w-4 h-4 z-10 text-violet-400" />
              <span className="z-10">{link.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="hidden md:flex items-center gap-4">
        <Link href="/upload" className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-violet-600/10">
          Get Started
        </Link>
      </div>

      {/* Mobile Nav Button */}
      <button 
        className="md:hidden text-gray-400 hover:text-white p-1"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-0 right-0 bg-gray-950/95 border-b border-white/10 flex flex-col p-6 gap-4 md:hidden backdrop-blur-xl z-40"
          >
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-all ${isActive ? 'bg-white/10 text-white border border-white/10' : 'text-gray-400 hover:bg-white/5'}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="w-5 h-5 text-violet-400" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <Link 
              href="/upload" 
              className="mt-2 text-center py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-all shadow-md text-sm"
              onClick={() => setMobileOpen(false)}
            >
              Get Started
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
