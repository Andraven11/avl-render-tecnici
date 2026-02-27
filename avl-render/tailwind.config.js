/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        avl: {
          bg: '#0d0f1a',
          bg2: '#13162a',
          border: '#1e2545',
          cyan: '#7ec8e3',
          gold: '#f0c040',
          muted: '#607090',
        }
      }
    },
  },
  plugins: [],
}
