const { tokens } = require('./app/src/renderer/src/styles/tokens')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/src/renderer/src/**/*.{ts,tsx}', './app/src/renderer/index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: tokens.color,
      spacing: tokens.spacing,
      borderRadius: tokens.radius,
      fontSize: tokens.fontSize,
      fontWeight: tokens.fontWeight,
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
}
