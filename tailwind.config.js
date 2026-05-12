const { tokens } = require('./app/src/renderer/src/styles/tokens')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/src/renderer/src/**/*.{ts,tsx}', './app/src/renderer/index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ...tokens.color,
        // Semantic aliases used throughout components
        surface: tokens.color.bg.primary,
        border: tokens.color.border.primary,
        // Accent numeric scale (used as accent-50, accent-200, accent-500, accent-600, accent-700, accent-900)
        accent: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          // Named aliases for semantic use
          blue: tokens.color.accent.blue,
          blueLight: tokens.color.accent.blueLight,
          blueDark: tokens.color.accent.blueDark,
          red: tokens.color.accent.red,
          redLight: tokens.color.accent.redLight,
          green: tokens.color.accent.green,
          greenLight: tokens.color.accent.greenLight,
          amber: tokens.color.accent.amber,
          amberLight: tokens.color.accent.amberLight,
        },
        skeleton: tokens.color.skeleton,
      },
      spacing: tokens.spacing,
      borderRadius: tokens.radius,
      fontSize: {
        ...tokens.fontSize,
        // 2xs for very small labels used in metadata bars and timestamps
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      fontWeight: tokens.fontWeight,
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        elevated: '0 4px 16px -2px rgba(0,0,0,0.10), 0 1px 4px -1px rgba(0,0,0,0.06)',
      },
    }
  },
  plugins: []
}
