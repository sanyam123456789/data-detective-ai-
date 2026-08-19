import './globals.css';
import Navbar from '@/components/Navbar';
import QueryProvider from '@/components/QueryProvider';
import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Data Detective AI // Forensic Data Investigation Ledger',
  description: 'AI-assisted data forensics ledger — uncover anomalies, audit distributions, verify chain of custody, and generate production pipelines.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${plusJakartaSans.variable}`}
    >
      <body className="antialiased min-h-screen flex flex-col justify-between bg-ink-900 text-paper-100 font-body selection:bg-evidence-amber selection:text-ink-950">
        <QueryProvider>
          {/* Bureau Status Banner */}
          <div className="bg-ink-950 border-b border-ruling text-[11px] font-mono text-paper-400 px-6 py-1 flex items-center justify-between z-50">
            <div className="flex items-center gap-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-evidence-emerald" />
              <span>DD-AI FORENSIC CORE v2.4</span>
              <span className="hidden sm:inline text-ink-600">|</span>
              <span className="hidden sm:inline">MODE: ACTIVE AUDIT</span>
            </div>
            <div className="flex items-center gap-4 text-[10px]">
              <span className="hidden md:inline">CHAIN-OF-CUSTODY: VERIFIED</span>
              <span className="text-paper-400">LEDGER STATUS: READY</span>
            </div>
          </div>

          {/* Navigation Bar */}
          <Navbar />
          
          {/* Main Content Workspace */}
          <main className="flex-grow pt-20 px-4 sm:px-6 md:px-10 max-w-7xl mx-auto w-full pb-16 z-10">
            {children}
          </main>

          {/* Forensic Ledger Docket Footer */}
          <footer className="w-full border-t border-ruling bg-ink-950/80 py-6 px-6 md:px-12 text-xs font-mono text-paper-400 z-10">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-paper-300 font-semibold uppercase tracking-wider">Data Detective AI</span>
                <span className="text-ink-600">/</span>
                <span className="text-[11px]">BUREAU OF FORENSIC DATA INTELLIGENCE</span>
              </div>
              <div className="flex gap-6 text-[11px]">
                <span className="text-ink-500">AUDIT TRAIL PRESERVED</span>
                <span className="text-ink-500">AES-256 ENCRYPTED</span>
              </div>
            </div>
          </footer>
        </QueryProvider>
      </body>
    </html>
  );
}
