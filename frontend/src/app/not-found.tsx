'use client';

import Link from 'next/link';
import { ShieldAlert, ArrowLeft, FolderSearch } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6 font-mono">
      <div className="w-16 h-16 bg-ink-800 border border-evidence-crimson/40 text-evidence-crimson rounded flex items-center justify-center shadow-lg">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 stamp-tag stamp-tag-crimson text-[10px]">
          <span>ERROR 404 // DOCKET NOT FOUND</span>
        </div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-paper-50">
          Evidence Coordinates Missing
        </h1>
        <p className="text-paper-400 text-xs max-w-sm mx-auto font-body leading-relaxed">
          The requested case file or forensic endpoint could not be located in the active bureau registry.
        </p>
      </div>

      <div>
        <Link
          id="not-found-back-home"
          href="/"
          className="btn-primary text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Bureau Center</span>
        </Link>
      </div>
    </div>
  );
}
