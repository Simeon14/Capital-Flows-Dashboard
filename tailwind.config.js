/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        inflow: '#00ff41', // Matrix green
        outflow: '#ff0040', // Bright red
        neutral: '#808080',
        background: '#000000', // Pure black
        card: '#111111', // Dark gray
        border: '#444444', // Subtle border
        'terminal-green': '#00ff41',
        'terminal-amber': '#ffb000',
        'terminal-cyan': '#00ffff',
        'retro-blue': '#0080ff',
        'subtle-green': '#4ade80', // Muted green (Tailwind green-400)
        'subtle-amber': '#cc8800', // Toned down amber
      },
      animation: {
        'scroll': 'scroll 60s linear infinite',
        'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        scroll: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      }
    },
  },
  plugins: [],
}
