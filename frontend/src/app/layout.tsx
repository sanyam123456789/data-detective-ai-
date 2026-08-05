import './globals.css';
import Navbar from '@/components/Navbar';
import QueryProvider from '@/components/QueryProvider';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Detective AI | Discover Data Insights',
  description: 'AI-powered Data Engineering platform for automated profiling, quality detection, SQL generation, and smart pipelines.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col justify-between relative">
        <QueryProvider>
          {/* Header */}
          <Navbar />
          
          {/* Background Glows */}
          <div className="absolute top-[10%] left-[5%] glow-dot" />
          <div className="absolute top-[60%] right-[5%] glow-dot" style={{ backgroundColor: '#6366f1' }} />

          {/* Main content */}
          <main className="flex-grow pt-24 px-6 md:px-12 max-w-7xl mx-auto w-full pb-16 z-10">
            {children}
          </main>

          {/* Footer */}
          <footer className="w-full border-t border-white/5 bg-gray-950/40 py-8 px-6 md:px-12 text-center text-xs text-gray-500 z-10">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>© 2026 Data Detective AI. All rights reserved.</div>
              <div className="flex gap-6">
                <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-gray-300 transition-colors">Security</a>
              </div>
            </div>
          </footer>
        </QueryProvider>
      </body>
    </html>
  );
}
