/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['Inter', 'Pretendard Variable', 'Pretendard', 'sans-serif'],
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        body: ['Pretendard Variable', 'Pretendard', 'Inter', 'system-ui', 'sans-serif'],
      },
      /* 확정 팔레트 (기획서 §2) */
      colors: {
        ocean: {
          50: '#E6F1FB',
          100: '#B5D4F4',
          200: '#85B7EB',
          400: '#378ADD',
          800: '#0C447C',
        },
        lime: '#E8F97A',
      },
      // 기본 rounded 를 풀 필(pill)로 → 마크업의 모든 `rounded` 가 알약 모양
      borderRadius: { DEFAULT: '9999px' },
    },
  },
  plugins: [],
};
