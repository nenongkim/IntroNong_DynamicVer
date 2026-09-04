/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Instrument Serif', 'serif'],
        body: ['Barlow', 'sans-serif'],
        dirtyline: ['Dirtyline', 'sans-serif'],
      },
      // 기본 rounded 를 풀 필(pill)로 → 마크업의 모든 `rounded` 가 알약 모양
      borderRadius: { DEFAULT: '9999px' },
    },
  },
  plugins: [],
};
