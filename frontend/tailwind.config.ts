import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-space)', 'Space Grotesk', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'IBM Plex Mono', 'monospace'],
        body: ['var(--font-sans)', 'Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#0F1218',
          900: '#13171F',
          850: '#171D27',
          800: '#1B222D',
          750: '#202836',
          700: '#252F3F',
          600: '#323E52',
          500: '#475569',
        },
        paper: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
        },
        evidence: {
          amber: '#E59500',
          amberGlow: 'rgba(229, 149, 0, 0.15)',
          crimson: '#D9383A',
          crimsonGlow: 'rgba(217, 56, 58, 0.15)',
          cyan: '#0284C7',
          cyanGlow: 'rgba(2, 132, 199, 0.15)',
          emerald: '#10B981',
        },
        ruling: '#2A3442',
      },
    },
  },
  plugins: [],
};
export default config;
