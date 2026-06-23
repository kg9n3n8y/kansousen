/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sumi: '#1a1a1a',
        washi: '#f5f0e8',
        tatami: '#ebe4d4',
        ai: {
          DEFAULT: '#2c4a6e',
          dark: '#1e3550',
          light: 'rgba(44, 74, 110, 0.12)'
        },
        beni: '#8b2500',
        border: '#c4b89a',
        muted: '#5c5348'
      },
      fontFamily: {
        sans: [
          'Hiragino Maru Gothic Pro',
          'Hiragino Kaku Gothic ProN',
          'Yu Gothic',
          'Noto Sans JP',
          'sans-serif'
        ]
      },
      borderRadius: {
        card: '1rem'
      },
      boxShadow: {
        card: '0 12px 32px rgba(26, 26, 26, 0.1)',
        sheet: '0 -4px 24px rgba(26, 26, 26, 0.12)'
      }
    }
  },
  plugins: []
};
