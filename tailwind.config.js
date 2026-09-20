/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        quote: ['"Ma Shan Zheng"', 'KaiTi', 'STKaiti', 'serif'],
      },
    },
  },
  plugins: [],
}
