/**
 * ComposeModal — keyboard-first compose/reply surface.
 *
 * Design reference: Superhuman compose modal + Linear command palette discipline.
 * - Full-bleed backdrop with 8-pt grid spacing throughout
 * - Focus management: To field on open, Tab cycles fields in order
 * - Cmd+Enter sends, Esc discards (with confirmation if dirty)
 * - Design tokens only — no hardcoded colors
 */

import React, { useEffect, useRef, useCallback } from 'react'
import { useCompose } from './ComposeContext'
import { tokens } from '../../../styles/tokens'

const t = tokens

/* ── Inline-style helpers (tokens → CSS values) ─────────────── */
const s = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
  },
  modal: {
    position: 'relative' as const,
    width: '680px',
    maxWidth: 'calc(100vw - 48px)',
    maxHeight: 'calc(100vh - 80px)',
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: t.color.bg.elevated,
    border: `1px solid ${t.color.border.default}`,
    borderRadius: t.radius.xl,
    boxShadow: t.shadow.modal,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${t.space[4]} ${t.space[6]}`,
    borderBottom: `1px solid ${t.color.border.subtle}`,
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: t.font.size.md,
    fontWeight: t.font.weight.semibold,
    color: t.color.text.primary,
    letterSpacing: '-0.01em',
  },
  headerClose: {
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: t.radius.md,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: t.color.text.secondary,
    fontSize: '18px',
    lineHeight: 1,
    transition: `background ${t.duration.fast}, color ${t.duration.fast}`,
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'flex-start',
    borderBottom: `1px solid ${t.color.border.subtle}`,
    minHeight: '44px',
  },
  fieldLabel: {
    width: '56px',
    flexShrink: 0,
    paddingTop: '12px',
    paddingLeft: t.space[6],
    fontSize: t.font.size.sm,
    fontWeight: t.font.weight.medium,
    color: t.color.text.secondary,
    userSelect: 'none' as const,
  },
  fieldContent: {
    flex: 1,
    display: 'flex',
    flexWrap: 'wrap' as const,
    alignItems: 'center',
    gap: '4px',
    padding: `10px ${t.space[4]} 10px 0`,
    minHeight: '44px',
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    height: '24px',
    padding: `0 ${t.space[2]}`,
    backgroundColor: t.color.bg.active,
    border: `1px solid ${t.color.border.default}`,
    borderRadius: t.radius.full,
    fontSize: t.font.size.sm,
    color: t.color.text.primary,
    whiteSpace: 'nowrap' as const,
  },
  pillRemove: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '14px',
    height: '14px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: t.color.text.secondary,
    padding: 0,
    lineHeight: 1,
    fontSize: '12px',
    borderRadius: '50%',
  },
  textInput: {
    flex: 1,
    minWidth: '120px',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: t.color.text.primary,
    fontSize: t.font.size.base,
    fontFamily: t.font.family.sans,
    lineHeight: t.font.lineHeight.base,
    padding: 0,
  },
  ccToggle: {
    padding: `10px ${t.space[4]} 10px ${t.space[2]}`,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: t.font.size.sm,
    color: t.color.text.secondary,
    borderRadius: t.radius.sm,
    transition: `color ${t.duration.fast}`,
    flexShrink: 0,
  },
  bodyWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  },
  bodyTextarea: {
    flex: 1,
    padding: `${t.space[4]} ${t.space[6]}`,
    border: 'none',
    outline: 'none',
    resize: 'none' as const,
    background: 'transparent',
    color: t.color.text.primary,
    fontSize: t.font.size.base,
    fontFamily: t.font.family.sans,
    lineHeight: t.font.lineHeight.relaxed,
    minHeight: '200px',
    overflowY: 'auto' as const,
  },
  quotedBody: {
    padding: `${t.space[3]} ${t.space[6]}`,
    borderTop: `1px solid ${t.color.border.subtle}`,
    fontSize: t.font.size.sm,
    color: t.color.text.secondary,
    fontStyle: 'italic' as const,
    whiteSpace: 'pre-wrap' as const,
    maxHeight: '120px',
    overflowY: 'auto' as const,
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${t.space[3]} ${t.space[6]}`,
    borderTop: `1px solid ${t.color.border.subtle}`,
    flexShrink: 0,
    gap: t.space[3],
  },
  footerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: t.space[2],
  },
  btnAiDraft: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: t.space[2],
    height: '32px',
    padding: `0 ${t.space[3]}`,
    border: `1px solid ${t.color.border.default}`,
    borderRadius: t.radius.md,
    background: 'transparent',
    color: t.color.text.secondary,
    fontSize: t.font.size.sm,
    fontWeight: t.font.weight.medium,
    cursor: 'pointer',
    transition: `background ${t.duration.fast}, border-color ${t.duration.fast}, color ${t.duration.fast}`,
  },
  btnDiscard: {
    display: 'inline-flex',
    alignItems: 'center',
    height: '32px',
    padding: `0 ${t.space[3]}`,
    border: `1px solid ${t.color.border.default}`,
    borderRadius: t.radius.md,
    background: 'transparent',
    color: t.color.text.secondary,
    fontSize: t.font.size.sm,
    fontWeight: t.font.weight.medium,
    cursor: 'pointer',
    transition: `background ${t.duration.fast}, color ${t.duration.fast}`,
  },
  btnSend: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: t.space[2],
    height: '32px',
    padding: `0 ${t.space[4]}`,
    border: 'none',
    borderRadius: t.radius.md,
    background: t.color.accent[600],
    color: '#ffffff',
    fontSize: t.font.size.sm,
    fontWeight: t.font.weight.semibold,
    cursor: 'pointer',
    transition: `background ${t.duration.fast}, opacity ${t.duration.fast}`,
    letterSpacing: '-0.01em',
  },
  kbd: {
    display: 'inline-block',
    padding: '1px 5px',
    borderRadius: '3px',
    border: `1px solid rgba(255,255,255,0.15)`,
    fontSize: '10px',
    lineHeight: '16px',
    color: 'rgba(255,255,255,0.6)',
    fontFamily: t.font.family.mono,
    marginLeft: '4px',
    verticalAlign: 'middle',
  },
  errorBanner: {
    padding: `${t.space[2]} ${t.space[6]}`,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderTop: `1px solid rgba(239, 68, 68, 0.2)`,
    fontSize: t.font.size.sm,
    color: t.color.text.danger,
    display: 'flex',
    alignItems: 'center',
    gap: t.space[2],
  },
  successBanner: {
    padding: `${t.space[2]} ${t.space[6]}`,
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    borderTop: `1px solid rgba(52, 211, 153, 0.2)`,
    fontSize: t.font.size.sm,
    color: t.color.text.success,
    display: 'flex',
    alignItems: 'center',
    gap: t.space[2],
  },
  /** Discard confirmation overlay */
  discardDialog: {
    position: 'absolute' as const,
    inset: 0,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17,24,39,0.85)',
    backdropFilter: 'blur(2px)',
    borderRadius: t.radius.xl,
  },
  discardCard: {
    width: '320px',
    backgroundColor: t.color.bg.elevated,
    border: `1px solid ${t.color.border.default}`,
    borderRadius: t.radius.lg,
    padding: t.space[6],
    boxShadow: t.shadow.lg,
    textAlign: 'center' as const,
  },
  discardTitle: {
    fontSize: t.font.size.md,
    fontWeight: t.font.weight.semibold,
    color: t.color.text.primary,
    marginBottom: t.space[2],
  },
  discardBody: {
    fontSize: t.font.size.sm,
    color: t.color.text.secondary,
    marginBottom: t.space[6],
    lineHeight: t.font.lineHeight.base,
  },
  discardActions: {
    display: 'flex',
    gap: t.space[3],
    justifyContent: 'center',
  },
  btnDiscardConfirm: {
    flex: 1,
    height: '36px',
    border: `1px solid rgba(239, 68, 68, 0.4)`,
    borderRadius: t.radius.md,
    background: 'rgba(239, 68, 68, 0.12)',
    color: '#f87171',
    fontSize: t.font.size.sm,
    fontWeight: t.font.weight.medium,
    cursor: 'pointer',
    transition: `background ${t.duration.fast}`,
  },
  btnKeepEditing: {
    flex: 1,
    height: '36px',
    border: `1px solid ${t.color.border.default}`,
    borderRadius: t.radius.md,
    background: t.color.bg.hover,
    color: t.color.text.primary,
    fontSize: t.font.size.sm,
    fontWeight: t.font.weight.medium,
    cursor: 'pointer',
    transition: `background ${t.duration.fast}`,
  },
}

/* ── Spinner component ──────────────────────────────────────── */
function Spinner(): JSX.Element {
  return (
    <span
      style={{
        display: 'inline-block',
        width: '14px',
        height: '14px',
        border: '2px solid rgba(255,255,255,0.25)',
        borderTopColor: '#ffffff',
        borderRadius: '50%',
      }}
      className="animate-spin"
      aria-hidden="true"
    />
  )
}

/* ── SparkleIcon for AI Draft button ────────────────────────── */
function SparkleIcon(): JSX.Element {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1L9.5 6L14 7L9.5 8L8 13L6.5 8L2 7L6.5 6L8 1Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  )
}

/* ── RecipientPill ──────────────────────────────────────────── */
function RecipientPill({
  entry,
  onRemove,
}: {
  entry: { address: string; name?: string }
  onRemove: () => void
}): JSX.Element {
  const label = entry.name ? `${entry.name} <${entry.address}>` : entry.address
  return (
    <span style={s.pill} title={label}>
      <span
        style={{
          maxWidth: '180px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {entry.name ?? entry.address}
      </span>
      <button
        type="button"
        style={s.pillRemove}
        onClick={onRemove}
        tabIndex={-1}
        aria-label={`Remove ${entry.address}`}
      >
        ×
      </button>
    </span>
  )
}

/* ── Main ComposeModal ──────────────────────────────────────── */
interface ComposeModalProps {
  accountId: string
}

export function ComposeModal({ accountId }: ComposeModalProps): JSX.Element | null {
  const { state, dispatch, send, requestAiDraft } = useCompose()

  // Refs for focus management
  const toInputRef = useRef<HTMLInputElement>(null)
  const ccInputRef = useRef<HTMLInputElement>(null)
  const subjectRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const sendBtnRef = useRef<HTMLButtonElement>(null)

  // Focus To field on open
  useEffect(() => {
    if (state.isOpen) {
      requestAnimationFrame(() => {
        toInputRef.current?.focus()
      })
    }
  }, [state.isOpen])

  // Global keyboard handler (Esc)
  useEffect(() => {
    if (!state.isOpen) return
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && !state.discardConfirmVisible) {
        e.preventDefault()
        dispatch({ type: 'DISCARD_REQUEST' })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [state.isOpen, state.discardConfirmVisible, dispatch])

  const handleSend = useCallback(async () => {
    await send(accountId)
  }, [send, accountId])

  const handleAiDraft = useCallback(async () => {
    await requestAiDraft(accountId)
  }, [requestAiDraft, accountId])

  // Commit To input on Enter / Tab / comma
  const handleToKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
        if (state.toInput.trim()) {
          e.preventDefault()
          dispatch({ type: 'COMMIT_TO_INPUT' })
          if (e.key === 'Tab') subjectRef.current?.focus()
        }
      } else if (e.key === 'Backspace' && state.toInput === '' && state.to.length > 0) {
        dispatch({ type: 'REMOVE_TO', payload: state.to.length - 1 })
      }
    },
    [state.toInput, state.to, dispatch]
  )

  // Commit Cc input on Enter / Tab / comma
  const handleCcKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',') {
        if (state.ccInput.trim()) {
          e.preventDefault()
          dispatch({ type: 'COMMIT_CC_INPUT' })
          if (e.key === 'Tab') subjectRef.current?.focus()
        }
      } else if (e.key === 'Backspace' && state.ccInput === '' && state.cc.length > 0) {
        dispatch({ type: 'REMOVE_CC', payload: state.cc.length - 1 })
      }
    },
    [state.ccInput, state.cc, dispatch]
  )

  const handleSubjectKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        bodyRef.current?.focus()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        void handleSend()
      }
    },
    [handleSend]
  )

  const handleBodyKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        void handleSend()
      }
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault()
        sendBtnRef.current?.focus()
      }
    },
    [handleSend]
  )

  // Prevent backdrop click from closing when the discard dialog is open
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        dispatch({ type: 'DISCARD_REQUEST' })
      }
    },
    [dispatch]
  )

  if (!state.isOpen) return null

  const isSending = state.sendStatus === 'sending'
  const isAiLoading = state.aiDraftStatus === 'loading'
  const canSend = state.to.length > 0 || state.toInput.includes('@')
  const title = state.mode === 'reply' ? 'Reply' : 'New Message'

  return (
    <div
      style={s.overlay}
      className="animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={handleBackdropClick}
      data-testid="compose-overlay"
    >
      <div style={s.modal} className="animate-slideUp" onClick={(e) => e.stopPropagation()}>
        {/* ── Discard confirmation ── */}
        {state.discardConfirmVisible && (
          <div style={s.discardDialog} role="alertdialog" aria-label="Discard draft?">
            <div style={s.discardCard}>
              <div style={s.discardTitle}>Discard this draft?</div>
              <div style={s.discardBody}>
                Your message will be permanently deleted. This cannot be undone.
              </div>
              <div style={s.discardActions}>
                <button
                  type="button"
                  style={s.btnDiscardConfirm}
                  onClick={() => dispatch({ type: 'DISCARD_CONFIRM' })}
                  data-testid="discard-confirm"
                >
                  Discard
                </button>
                <button
                  type="button"
                  style={s.btnKeepEditing}
                  onClick={() => dispatch({ type: 'DISCARD_CANCEL' })}
                  autoFocus
                  data-testid="discard-cancel"
                >
                  Keep editing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div style={s.header}>
          <span style={s.headerTitle}>{title}</span>
          <button
            type="button"
            style={s.headerClose}
            onClick={() => dispatch({ type: 'DISCARD_REQUEST' })}
            aria-label="Close compose"
            tabIndex={-1}
          >
            ×
          </button>
        </div>

        {/* ── To field ── */}
        <div style={s.fieldRow} data-testid="to-field">
          <span style={s.fieldLabel}>To</span>
          <div style={s.fieldContent}>
            {state.to.map((r, i) => (
              <RecipientPill
                key={`${r.address}-${i}`}
                entry={r}
                onRemove={() => dispatch({ type: 'REMOVE_TO', payload: i })}
              />
            ))}
            <input
              ref={toInputRef}
              type="email"
              autoComplete="email"
              placeholder={state.to.length === 0 ? 'Add recipients…' : ''}
              style={s.textInput}
              value={state.toInput}
              onChange={(e) => dispatch({ type: 'SET_TO_INPUT', payload: e.target.value })}
              onKeyDown={handleToKeyDown}
              onBlur={() => {
                if (state.toInput.trim()) dispatch({ type: 'COMMIT_TO_INPUT' })
              }}
              data-testid="to-input"
              aria-label="To"
            />
          </div>
          {/* Cc toggle button */}
          <button
            type="button"
            style={s.ccToggle}
            onClick={() => dispatch({ type: 'TOGGLE_CC' })}
            title="Toggle Cc field"
            tabIndex={-1}
            aria-label={state.ccVisible ? 'Hide Cc' : 'Add Cc'}
          >
            {state.ccVisible ? 'Hide Cc' : 'Cc'}
          </button>
        </div>

        {/* ── Cc field (conditional) ── */}
        {state.ccVisible && (
          <div style={s.fieldRow} data-testid="cc-field">
            <span style={s.fieldLabel}>Cc</span>
            <div style={s.fieldContent}>
              {state.cc.map((r, i) => (
                <RecipientPill
                  key={`${r.address}-${i}`}
                  entry={r}
                  onRemove={() => dispatch({ type: 'REMOVE_CC', payload: i })}
                />
              ))}
              <input
                ref={ccInputRef}
                type="email"
                autoComplete="email"
                placeholder={state.cc.length === 0 ? 'Add Cc…' : ''}
                style={s.textInput}
                value={state.ccInput}
                onChange={(e) => dispatch({ type: 'SET_CC_INPUT', payload: e.target.value })}
                onKeyDown={handleCcKeyDown}
                onBlur={() => {
                  if (state.ccInput.trim()) dispatch({ type: 'COMMIT_CC_INPUT' })
                }}
                data-testid="cc-input"
                aria-label="Cc"
              />
            </div>
          </div>
        )}

        {/* ── Subject field ── */}
        <div style={s.fieldRow} data-testid="subject-field">
          <span style={s.fieldLabel}>Subject</span>
          <div style={s.fieldContent}>
            <input
              ref={subjectRef}
              type="text"
              placeholder="Subject…"
              style={s.textInput}
              value={state.subject}
              onChange={(e) => dispatch({ type: 'SET_SUBJECT', payload: e.target.value })}
              onKeyDown={handleSubjectKeyDown}
              data-testid="subject-input"
              aria-label="Subject"
            />
          </div>
        </div>

        {/* ── Body ── */}
        <div style={s.bodyWrapper}>
          <textarea
            ref={bodyRef}
            style={s.bodyTextarea}
            placeholder={
              state.aiDraftStatus === 'loading'
                ? 'Drafting with AI…'
                : 'Write your message…'
            }
            value={state.body}
            onChange={(e) => dispatch({ type: 'SET_BODY', payload: e.target.value })}
            onKeyDown={handleBodyKeyDown}
            disabled={isAiLoading}
            data-testid="body-input"
            aria-label="Message body"
          />

          {/* Quoted reply body */}
          {state.mode === 'reply' && state.replyQuotedBody && (
            <div style={s.quotedBody} aria-label="Quoted message">
              <div
                style={{
                  fontSize: t.font.size.xs,
                  fontStyle: 'normal',
                  color: t.color.text.secondary,
                  marginBottom: t.space[2],
                  fontWeight: t.font.weight.medium,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Original message
              </div>
              {state.replyQuotedBody}
            </div>
          )}
        </div>

        {/* ── Error / Success banners ── */}
        {state.sendStatus === 'error' && state.sendError && (
          <div style={s.errorBanner} role="alert" data-testid="send-error">
            <span>⚠</span> {state.sendError}
          </div>
        )}
        {state.sendStatus === 'success' && (
          <div style={s.successBanner} role="status" data-testid="send-success">
            <span>✓</span> Message sent
          </div>
        )}
        {state.aiDraftStatus === 'error' && state.aiDraftError && (
          <div style={s.errorBanner} role="alert" data-testid="ai-draft-error">
            <span>⚠</span> {state.aiDraftError}
          </div>
        )}

        {/* ── Footer ── */}
        <div style={s.footer}>
          <div style={s.footerLeft}>
            <button
              type="button"
              style={s.btnAiDraft}
              onClick={() => void handleAiDraft()}
              disabled={isAiLoading || isSending}
              title="Draft with AI"
              data-testid="ai-draft-btn"
            >
              {isAiLoading ? <Spinner /> : <SparkleIcon />}
              {isAiLoading ? 'Drafting…' : 'Draft with AI'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: t.space[2] }}>
            <button
              type="button"
              style={s.btnDiscard}
              onClick={() => dispatch({ type: 'DISCARD_REQUEST' })}
              disabled={isSending}
              data-testid="discard-btn"
            >
              Discard
            </button>

            <button
              ref={sendBtnRef}
              type="button"
              style={{
                ...s.btnSend,
                opacity: (!canSend || isSending) ? 0.5 : 1,
                cursor: (!canSend || isSending) ? 'not-allowed' : 'pointer',
              }}
              onClick={() => void handleSend()}
              disabled={!canSend || isSending}
              title="Send (⌘+Enter)"
              data-testid="send-btn"
            >
              {isSending ? <Spinner /> : null}
              {isSending ? 'Sending…' : (
                <>
                  Send
                  <span style={s.kbd}>⌘↵</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
