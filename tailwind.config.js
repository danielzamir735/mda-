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
    },
  },
  plugins: [],
};
