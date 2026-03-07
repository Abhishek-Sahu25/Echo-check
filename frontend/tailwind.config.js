/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'stop-green-400': '#4ade80',
        'stop-green-600': '#16a34a',
        'stop-yellow-400': '#facc15',
        'stop-yellow-600': '#ca8a04',
        'stop-red-400': '#f87171',
        'stop-red-600': '#dc2626',
      }
    },
  },
  plugins: [],
}