/**
 * Design tokens for Genmail desktop.
 * 8-pt spacing rhythm. Two accent colors max. No hardcoded values in components.
 *
 * Usage: import { tokens } from '@/styles/tokens'
 * Then use tokens.color.bg.primary etc. in inline styles,
 * or reference the CSS custom properties in Tailwind classes.
 */

export const tokens = {
  /** Spacing follows 8-pt grid */
  space: {
    0: '0px',
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

  /** Type ramp */
  font: {
    size: {
      xs: '11px',
      sm: '12px',
      base: '13px',
      md: '14px',
      lg: '16px',
      xl: '18px',
      '2xl': '22px',
    },
    weight: {
      regular: '400',
      medium: '500',
      semibold: '600',
    },
    lineHeight: {
      tight: '1.25',
      base: '1.5',
      relaxed: '1.625',
    },
    family: {
      sans: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
    },
  },

  /** Border radius */
  radius: {
    sm: '4px',
    md: '6px',
    lg: '10px',
    xl: '14px',
    full: '9999px',
  },

  /** Shadow */
  shadow: {
    sm: '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.08)',
    md: '0 4px 12px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)',
    lg: '0 8px 32px rgba(0,0,0,0.16), 0 4px 12px rgba(0,0,0,0.08)',
    modal: '0 24px 64px rgba(0,0,0,0.24), 0 8px 24px rgba(0,0,0,0.12)',
  },

  /** Duration for transitions */
  duration: {
    fast: '100ms',
    base: '150ms',
    slow: '250ms',
  },

  /** Colors — semantic layer on top of neutrals */
  color: {
    // Neutral scale (dark mode first — matches most desktop apps)
    neutral: {
      0: '#ffffff',
      50: '#f9fafb',
      100: '#f3f4f6',
      150: '#eceef1',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      850: '#161d27',
      900: '#111827',
      950: '#0a0f1a',
    },

    /** Primary accent — indigo, used sparingly */
    accent: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
    },

    /** Semantic surfaces (dark mode) */
    bg: {
      app: '#111827',       // outermost app bg
      sidebar: '#0f1623',   // sidebar / nav
      surface: '#1a2233',   // card / panel
      elevated: '#1f2a3d',  // modal / popover
      input: '#0f1623',     // input field bg
      hover: '#243046',     // hover state bg
      active: '#2a3a55',    // pressed / selected
    },

    /** Text */
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
      tertiary: '#64748b',
      disabled: '#475569',
      accent: '#818cf8',
      danger: '#f87171',
      success: '#34d399',
    },

    /** Borders */
    border: {
      subtle: '#1e293b',
      default: '#2d3f57',
      strong: '#3d5270',
    },
  },
} as const

export type Tokens = typeof tokens
