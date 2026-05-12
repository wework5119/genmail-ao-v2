/**
 * Toast — transient success/error notification.
 * Auto-dismisses after 3 seconds.
 */

import React, { useEffect } from 'react'
import { tokens } from '../../../styles/tokens'

const t = tokens

type ToastVariant = 'success' | 'error'

interface ToastProps {
  message: string
  variant?: ToastVariant
  onDismiss: () => void
}

export function Toast({ message, variant = 'success', onDismiss }: ToastProps): JSX.Element {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const isSuccess = variant === 'success'

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="toast"
      className="animate-slideUp"
      style={{
        position: 'fixed',
        bottom: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        display: 'inline-flex',
        alignItems: 'center',
        gap: t.space[2],
        height: '36px',
        padding: `0 ${t.space[4]}`,
        borderRadius: t.radius.full,
        backgroundColor: isSuccess
          ? 'rgba(52, 211, 153, 0.15)'
          : 'rgba(239, 68, 68, 0.15)',
        border: `1px solid ${isSuccess ? 'rgba(52, 211, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
        boxShadow: t.shadow.md,
        fontSize: t.font.size.sm,
        fontWeight: t.font.weight.medium,
        color: isSuccess ? t.color.text.success : t.color.text.danger,
        backdropFilter: 'blur(8px)',
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden="true">{isSuccess ? '✓' : '⚠'}</span>
      {message}
    </div>
  )
}
