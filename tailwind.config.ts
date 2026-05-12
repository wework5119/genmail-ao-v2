import type { Config } from 'tailwindcss'
import {
  colors,
  fontSize,
  spacing,
  borderRadius,
  boxShadow,
  transitionDuration,
  transitionTimingFunction,
  fontWeight,
  lineHeight
} from './src/renderer/src/styles/tokens'

export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors,
      fontSize,
      spacing,
      borderRadius,
      boxShadow,
      transitionDuration,
      transitionTimingFunction,
      fontWeight,
      lineHeight,
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans"',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"'
        ],
        mono: [
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          '"Liberation Mono"',
          '"Courier New"',
          'monospace'
        ]
      }
    }
  },
  plugins: []
} satisfies Config
