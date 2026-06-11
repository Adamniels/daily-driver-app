/** @type {import('tailwindcss').Config} */
// Design tokens from docs/phase-4-app-home.md. Habit `color` values from the
// API are token names (violet, mint, coral, sunshine, sky, rose) — keep these
// keys in sync with @habit/shared's colorTokenSchema.
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        cream: '#FFF8F0',
        ink: '#3D3A4B',
        violet: { DEFAULT: '#7C6FF0', soft: '#E9E6FD' },
        mint: { DEFAULT: '#5ED5A8', soft: '#E0F7EE' },
        coral: { DEFAULT: '#FF8A7A', soft: '#FFE7E3' },
        sunshine: { DEFAULT: '#FFD66B', soft: '#FFF4D6' },
        sky: { DEFAULT: '#6BC6FF', soft: '#E2F3FF' },
        rose: { DEFAULT: '#F08FB8', soft: '#FCE7F0' },
      },
      borderRadius: {
        card: '20px',
        bubble: '24px',
      },
      fontFamily: {
        sans: ['Nunito_500Medium'],
        'sans-bold': ['Nunito_700Bold'],
        'sans-black': ['Nunito_900Black'],
      },
    },
  },
  plugins: [],
};
