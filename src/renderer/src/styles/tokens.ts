export const colors = {
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717'
  },
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
    900: '#1e3a8a'
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d'
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d'
  }
} as const

export const fontSize = {
  '2xs': '10px',
  xs: '11px',
  sm: '12px',
  base: '13px',
  md: '14px',
  lg: '15px',
  xl: '16px',
  '2xl': '18px',
  '3xl': '20px',
  '4xl': '24px',
  '5xl': '32px'
} as const

export const lineHeight = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2'
} as const

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700'
} as const

export const spacing = {
  0.5: '2px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px'
} as const

export const borderRadius = {
  none: '0',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  full: '9999px'
} as const

export const boxShadow = {
  'elevation-none': 'none',
  'elevation-low':
    '0px 1px 2px 0px rgba(0,0,0,0.05), 0px 1px 3px 0px rgba(0,0,0,0.1)',
  'elevation-medium':
    '0px 2px 4px 0px rgba(0,0,0,0.05), 0px 4px 6px -1px rgba(0,0,0,0.1)',
  'elevation-high':
    '0px 4px 6px -2px rgba(0,0,0,0.05), 0px 10px 15px -3px rgba(0,0,0,0.1)',
  'elevation-modal':
    '0px 8px 10px -6px rgba(0,0,0,0.05), 0px 20px 25px -5px rgba(0,0,0,0.1)'
} as const

export const transitionDuration = {
  fast: '100ms',
  standard: '200ms',
  slow: '400ms'
} as const

export const transitionTimingFunction = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
  'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
  'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
} as const

const tokens = {
  colors,
  fontSize,
  lineHeight,
  fontWeight,
  spacing,
  borderRadius,
  boxShadow,
  transitionDuration,
  transitionTimingFunction
} as const

export default tokens
