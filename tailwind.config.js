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
        // Accent numeric scale
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
        neutral: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        skeleton: tokens.color.skeleton,
      },
      spacing: tokens.spacing,
      borderRadius: tokens.radius,
      fontSize: {
        ...tokens.fontSize,
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      fontWeight: tokens.fontWeight,
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        elevated: '0 4px 16px -2px rgba(0,0,0,0.10), 0 1px 4px -1px rgba(0,0,0,0.06)',
        'palette': '0 8px 32px -4px rgba(0,0,0,0.16), 0 2px 8px -2px rgba(0,0,0,0.08)',
      },
    }
  },
  plugins: []
}
