/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crypto: {
          main: '#0a0f1e',
          accent: '#00f0ff', // Neon Cyan
          purple: '#7000ff', // Deep Purple
          glass: 'rgba(255, 255, 255, 0.05)',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}

