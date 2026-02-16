/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        glass: {
          bg: 'rgba(218, 165, 32, 0.08)',
          border: 'rgba(218, 165, 32, 0.2)',
          hover: 'rgba(218, 165, 32, 0.12)',
        },
        accent: { DEFAULT: '#DAA520', dark: '#B8860B' },
        gold: {
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#DAA520',
          600: '#B8860B',
          700: '#92400E',
        },
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
