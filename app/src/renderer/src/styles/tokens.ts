export const tokens = {
  color: {
    bg: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      tertiary: '#f3f4f6',
      inverse: '#111827',
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
      tertiary: '#6b7280',
      inverse: '#ffffff',
      link: '#2563eb',
    },
    border: {
      primary: '#e5e7eb',
      secondary: '#f3f4f6',
    },
    accent: {
      blue: '#2563eb',
      blueLight: '#dbeafe',
      blueDark: '#1e40af',
      red: '#dc2626',
      redLight: '#fef2f2',
      green: '#059669',
      greenLight: '#ecfdf5',
      amber: '#d97706',
      amberLight: '#fffbeb',
    },
    skeleton: {
      base: '#e5e7eb',
      shimmer: '#f3f4f6',
    },
    overlay: {
      dark: 'rgba(0, 0, 0, 0.5)',
    },
  },
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.8125rem', { lineHeight: '1.25rem' }],
    base: ['0.9375rem', { lineHeight: '1.5rem' }],
    lg: ['1.0625rem', { lineHeight: '1.5rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const

export type Tokens = typeof tokens
