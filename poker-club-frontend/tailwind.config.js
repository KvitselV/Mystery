/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        glass: {
          bg: 'rgba(255, 255, 255, 0.08)',
          border: 'rgba(255, 255, 255, 0.18)',
          hover: 'rgba(255, 255, 255, 0.12)',
        },
        accent: { DEFAULT: '#0ea5e9', dark: '#0284c7' },
      },
      backdropBlur: {
        xs: '2px',
      },
      fontFamily: {
        display: ['Clash Display', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
