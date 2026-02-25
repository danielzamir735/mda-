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
        'emt-red':    '#E53935',
        'emt-green':  '#43A047',
        'emt-yellow': '#FDD835',
        'emt-dark':   '#0D0D0D',
        'emt-light':  '#F5F5F5',
        'emt-gray':   '#1E1E1E',
        'emt-border': '#2C2C2C',
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
