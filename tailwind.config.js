/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        petroleum: {
          950: '#0a0f1e',
          900: '#0d1526',
          800: '#111d35',
          700: '#1a2d4f',
          600: '#1e3a6e',
        }
      }
    }
  },
  plugins: []
}
