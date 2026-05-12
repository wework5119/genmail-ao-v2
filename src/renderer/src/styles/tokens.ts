export const tokens = {
  spacing: {
    px: '1px',
    0.5: '2px',
    1: '4px',
    1.5: '6px',
    2: '8px',
    2.5: '10px',
    3: '12px',
    3.5: '14px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    9: '36px',
    10: '40px',
    12: '48px',
    16: '64px'
  },
  fontSize: {
    '2xs': '11px',
    xs: '12px',
    sm: '13px',
    base: '14px',
    lg: '15px',
    xl: '16px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '32px'
  },
  lineHeight: {
    tight: '16px',
    normal: '20px',
    relaxed: '22px',
    loose: '24px'
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  color: {
    accent: '#2563eb',
    accentHover: '#1d4ed8',
    unread: '#2563eb',
    error: '#dc2626',
    success: '#22c55e',
    warning: '#f59e0b'
  },
  animation: {
    fast: '120ms',
    normal: '200ms',
    slow: '300ms'
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    emphasize: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)'
  }
} as const

export type Token = typeof tokens
