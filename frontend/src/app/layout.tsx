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
  title: 'Data Detective AI — Autonomous Data Quality & Lakehouse Platform',
  description: 'AI-assisted data quality intelligence — uncover anomalies, audit distributions, verify chain of custody, and query AWS Athena lakehouse.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${plusJakartaSans.variable}`}
    >
      <body className="antialiased min-h-screen flex flex-col justify-between bg-[#141013] text-[#FAF5F6] font-body selection:bg-[#C89D66] selection:text-[#141013]">
        <QueryProvider>
          {/* Top Status Bar */}
          <div className="bg-[#100C0F] border-b border-[#382A34] text-[11px] font-mono text-[#D6C7C2] px-6 py-1.5 flex items-center justify-between z-50">
            <div className="flex items-center gap-3">
              <span className="inline-block w-2 h-2 rounded-full bg-[#5FA788] animate-pulse" />
              <span className="font-semibold text-[#FAF5F6]">DATA DETECTIVE AI v2.4</span>
              <span className="hidden sm:inline text-[#4E3B49]">|</span>
              <span className="hidden sm:inline text-[#D6C7C2]">ENGINE: ACTIVE</span>
            </div>
            <div className="flex items-center gap-4 text-[10px]">
              <span className="hidden md:inline font-medium text-[#E08D9D] bg-[#E08D9D]/15 px-2 py-0.5 rounded border border-[#E08D9D]/30">
                AWS LAKEHOUSE: READY
              </span>
              <span className="font-medium text-[#D6C7C2]">FASTAPI & GEMINI: CONNECTED</span>
            </div>
          </div>

          {/* Navigation Bar */}
          <Navbar />
          
          {/* Main Content Workspace */}
          <main className="flex-grow pt-20 px-4 sm:px-6 md:px-10 max-w-7xl mx-auto w-full pb-16 z-10">
            {children}
          </main>

          {/* Footer */}
          <footer className="w-full border-t border-[#382A34] bg-[#100C0F] py-6 px-6 md:px-12 text-xs font-mono text-[#D6C7C2] z-10">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[#FAF5F6] font-bold tracking-wider">Data Detective AI</span>
                <span className="text-[#4E3B49]">/</span>
                <span className="text-[11px] text-[#D6C7C2]">AUTONOMOUS DATA QUALITY & LAKEHOUSE INTELLIGENCE</span>
              </div>
              <div className="flex gap-6 text-[11px] font-medium text-[#9E8B95]">
                <span>AWS S3 / GLUE / ATHENA</span>
                <span>GEMINI 2.0 FLASH</span>
              </div>
            </div>
          </footer>
        </QueryProvider>
      </body>
    </html>
  );
}
