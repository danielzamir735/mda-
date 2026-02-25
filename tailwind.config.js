/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'emt-red':    '#DC2626',   // red-600 — actions, running state
        'emt-green':  '#16A34A',   // green-600 — success, results
        'emt-yellow': '#D97706',   // amber-600 — metronome / torch
        'emt-blue':   '#3B82F6',   // blue-500 — accent / O2 calc
        'emt-dark':   '#F1F5F9',   // slate-100 — page background
        'emt-light':  '#0F172A',   // slate-900 — primary text
        'emt-gray':   '#FFFFFF',   // white — card background
        'emt-border': '#CBD5E1',   // slate-300 — borders
        'emt-muted':  '#64748B',   // slate-500 — secondary text
      },
      keyframes: {
        'fade-scale': {
          '0%':   { opacity: '0', transform: 'scale(0.88)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-once': {
          '0%':   { opacity: '0', transform: 'scale(0.92)' },
          '15%':  { opacity: '1', transform: 'scale(1.03)' },
          '30%':  { transform: 'scale(1)' },
          '85%':  { opacity: '1' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-scale':  'fade-scale 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'pulse-once':  'pulse-once 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};
