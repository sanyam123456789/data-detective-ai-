'use client';

import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 space-y-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full flex items-center justify-center shadow-lg"
      >
        <AlertCircle className="w-8 h-8" />
      </motion.div>

      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">404 - Page Not Found</h1>
        <p className="text-gray-400 text-sm max-w-sm mx-auto">
          The detective searched everywhere, but this page could not be located. It might have been moved or deleted.
        </p>
      </div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Link
          id="not-found-back-home"
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition-all hover:scale-105 shadow-md shadow-violet-600/10"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Safety</span>
        </Link>
      </motion.div>
    </div>
  );
}
