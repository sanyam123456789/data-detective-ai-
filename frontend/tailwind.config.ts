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
          950: '#100C0F',
          900: '#141013',
          850: '#181216',
          800: '#1F181D',
          750: '#261E24',
          700: '#2C2129',
          600: '#382A34',
          500: '#4E3B49',
        },
        paper: {
          50: '#FAF5F6',
          100: '#F5EBEF',
          200: '#E8DCE1',
          300: '#D6C7C2',
          400: '#9E8B95',
        },
        evidence: {
          amber: '#C89D66',
          amberGlow: 'rgba(200, 157, 102, 0.15)',
          crimson: '#D96B60',
          crimsonGlow: 'rgba(217, 107, 96, 0.15)',
          cyan: '#E08D9D',
          cyanGlow: 'rgba(224, 141, 157, 0.15)',
          emerald: '#5FA788',
          camel: '#C89D66',
          rose: '#E08D9D',
          terracotta: '#D97762',
        },
        ruling: '#382A34',
      },
    },
  },
  plugins: [],
};
export default config;
