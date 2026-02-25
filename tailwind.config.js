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
        'emt-red':    '#EF233C',   // vibrant medical red — actions, running
        'emt-green':  '#22C55E',   // green-500 — success, results
        'emt-yellow': '#F59E0B',   // amber-500 — metronome
        'emt-blue':   '#60A5FA',   // blue-400 — O2 calc accent
        'emt-dark':   '#09090B',   // zinc-950 — page background
        'emt-light':  '#F4F4F5',   // zinc-100 — primary text
        'emt-gray':   '#111114',   // deep dark — card background
        'emt-border': '#3F3F46',   // zinc-700 — borders
        'emt-muted':  '#71717A',   // zinc-500 — secondary text
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
        'slide-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-scale': 'fade-scale 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'pulse-once': 'pulse-once 0.4s ease-out both',
        'slide-up':   'slide-up 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both',
      },
    },
  },
  plugins: [],
};
