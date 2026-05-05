/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        accent: "var(--accent)",
        accentBg: "var(--accent-bg)",
        bg: "var(--bg)",
        text: "var(--text)",
        textH: "var(--text-h)"
      ,
      'neon-pink': '#ff3ca6',
      'neon-purple': '#6f2bd1'
      },
      boxShadow: {
        neon: '0 10px 30px rgba(200, 70, 255, 0.12), inset 0 1px 0 rgba(255,255,255,0.02)'
      }
    }
  },
  plugins: [],
}
