/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/src/**/*.{ts,tsx}',
    './src/renderer/index.html'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: '#141414',
        panel:   '#1e1e1e',
        border:  '#2a2a2a',
        accent:  '#7c6af7',
      }
    }
  },
  plugins: []
}
