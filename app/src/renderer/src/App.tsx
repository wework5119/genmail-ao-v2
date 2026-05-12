/**
 * App — root component.
 * Renders the inbox shell with sidebar, thread list, and compose integration.
 * Keyboard shortcuts: ⌘N → new compose, R → reply to selected thread.
 */

import React, { useEffect, useCallback, useState } from 'react'
import { ComposeProvider, useCompose } from './compose/ComposeContext'
import { ComposeModal } from './compose/ComposeModal'
import { Toast } from './components/Toast'
import { tokens } from '../../styles/tokens'
import './index.css'

const t = tokens

/* ── Mock thread data ────────────────────────────────────────── */
interface MockThread {
  id: string
  subject: string
  snippet: string
  from: string
  fromAddress: string
  date: string
  unread: boolean
  body?: string
}

const MOCK_THREADS: MockThread[] = [
  {
    id: 'thread-1',
    subject: 'Q3 Planning — action items',
    snippet: "Here are the key items we discussed in today's planning session…",
    from: 'Sarah Chen',
    fromAddress: 'sarah.chen@example.com',
    date: '10:41 AM',
    unread: true,
    body: "Here are the key items we discussed in today's planning session. Please review the attached roadmap and share your feedback by Friday.\n\nBest,\nSarah",
  },
  {
    id: 'thread-2',
    subject: 'Design review feedback',
    snippet: 'The spacing looks off in the compose modal — can you bump the padding?',
    from: 'Alex Rivera',
    fromAddress: 'alex.rivera@example.com',
    date: '9:15 AM',
    unread: true,
    body: 'The spacing looks off in the compose modal — can you bump the padding?\n\nOtherwise LGTM.\n\n– Alex',
  },
  {
    id: 'thread-3',
    subject: 'Invoice #1042 — payment received',
    snippet: 'Thank you for your payment. Please find attached your receipt.',
    from: 'Billing',
    fromAddress: 'billing@acme.com',
    date: 'Yesterday',
    unread: false,
    body: 'Thank you for your payment of $1,200 for Invoice #1042. Please find attached your receipt.',
  },
  {
    id: 'thread-4',
    subject: 'Weekly standup notes — 2026-05-12',
    snippet: 'Shipped: compose modal, inbox list. In progress: thread detail…',
    from: 'Jordan Park',
    fromAddress: 'jordan.park@example.com',
    date: 'Yesterday',
    unread: false,
    body: 'Shipped: compose modal, inbox list. In progress: thread detail view.\n\n— Jordan',
  },
  {
    id: 'thread-5',
    subject: 'Your Genmail dogfood account is ready',
    snippet: 'Welcome to Genmail dogfood! Your account has been provisioned…',
    from: 'Genmail Team',
    fromAddress: 'team@genmail.app',
    date: 'Mon',
    unread: false,
    body: 'Welcome to Genmail dogfood! Your account has been provisioned. Launch the app and let us know what you think.\n\n– The Genmail Team',
  },
]

const DEFAULT_ACCOUNT_ID = 'default'

/* ── Styles ─────────────────────────────────────────────────── */
const appShell: React.CSSProperties = {
  display: 'flex',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
  backgroundColor: t.color.bg.app,
  color: t.color.text.primary,
  fontFamily: t.font.family.sans,
}

const sidebarStyle: React.CSSProperties = {
  width: '220px',
  flexShrink: 0,
  backgroundColor: t.color.bg.sidebar,
  borderRight: `1px solid ${t.color.border.subtle}`,
  display: 'flex',
  flexDirection: 'column',
  padding: `${t.space[4]} 0`,
}

const sidebarTitle: React.CSSProperties = {
  padding: `0 ${t.space[4]} ${t.space[4]}`,
  fontSize: t.font.size.lg,
  fontWeight: t.font.weight.semibold,
  color: t.color.text.primary,
  letterSpacing: '-0.02em',
}

const composeButton: React.CSSProperties = {
  margin: `0 ${t.space[4]} ${t.space[4]}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: t.space[2],
  height: '36px',
  border: 'none',
  borderRadius: t.radius.md,
  background: t.color.accent[600],
  color: '#ffffff',
  fontSize: t.font.size.sm,
  fontWeight: t.font.weight.semibold,
  cursor: 'pointer',
  letterSpacing: '-0.01em',
  transition: `background ${t.duration.fast}`,
}

const navItem: React.CSSProperties = {
  padding: `${t.space[2]} ${t.space[4]}`,
  fontSize: t.font.size.sm,
  color: t.color.text.secondary,
  cursor: 'default',
  display: 'flex',
  alignItems: 'center',
  gap: t.space[3],
}

const navItemActive: React.CSSProperties = {
  ...navItem,
  backgroundColor: t.color.bg.active,
  color: t.color.text.primary,
  fontWeight: t.font.weight.medium,
}

const threadListPane: React.CSSProperties = {
  width: '320px',
  flexShrink: 0,
  borderRight: `1px solid ${t.color.border.subtle}`,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const threadListHeader: React.CSSProperties = {
  padding: `${t.space[4]} ${t.space[5]}`,
  borderBottom: `1px solid ${t.color.border.subtle}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
}

const threadListTitle: React.CSSProperties = {
  fontSize: t.font.size.md,
  fontWeight: t.font.weight.semibold,
  color: t.color.text.primary,
  letterSpacing: '-0.01em',
}

const detailPane: React.CSSProperties = {
  flex: 1,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}

/* ── Thread row ─────────────────────────────────────────────── */
function ThreadRow({
  thread,
  isSelected,
  onClick,
}: {
  thread: MockThread
  isSelected: boolean
  onClick: () => void
}): JSX.Element {
  return (
    <div
      role="listitem"
      style={{
        padding: `${t.space[3]} ${t.space[5]}`,
        cursor: 'pointer',
        backgroundColor: isSelected ? t.color.bg.active : 'transparent',
        borderBottom: `1px solid ${t.color.border.subtle}`,
        transition: `background ${t.duration.fast}`,
        userSelect: 'none',
      }}
      onClick={onClick}
      data-testid={`thread-${thread.id}`}
      onMouseEnter={(e) => {
        if (!isSelected)
          (e.currentTarget as HTMLDivElement).style.backgroundColor = t.color.bg.hover
      }}
      onMouseLeave={(e) => {
        if (!isSelected)
          (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'
      }}
    >
      <div style={{ display: 'flex', gap: t.space[3], alignItems: 'flex-start' }}>
        {/* Unread indicator */}
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: thread.unread ? t.color.accent[400] : 'transparent',
            flexShrink: 0,
            marginTop: '5px',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* From + date row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '2px',
            }}
          >
            <span
              style={{
                fontSize: t.font.size.sm,
                fontWeight: thread.unread ? t.font.weight.semibold : t.font.weight.medium,
                color: thread.unread ? t.color.text.primary : t.color.text.secondary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {thread.from}
            </span>
            <span
              style={{
                fontSize: t.font.size.xs,
                color: t.color.text.tertiary,
                flexShrink: 0,
                marginLeft: t.space[2],
              }}
            >
              {thread.date}
            </span>
          </div>
          {/* Subject */}
          <div
            style={{
              fontSize: t.font.size.base,
              fontWeight: thread.unread ? t.font.weight.medium : t.font.weight.regular,
              color: thread.unread ? t.color.text.primary : t.color.text.secondary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginBottom: '2px',
            }}
          >
            {thread.subject}
          </div>
          {/* Snippet */}
          <div
            style={{
              fontSize: t.font.size.sm,
              color: t.color.text.tertiary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {thread.snippet}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Thread detail ──────────────────────────────────────────── */
function ThreadDetail({
  thread,
  onReply,
}: {
  thread: MockThread
  onReply: () => void
}): JSX.Element {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: t.color.bg.surface,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: `${t.space[5]} ${t.space[6]}`,
          borderBottom: `1px solid ${t.color.border.subtle}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: t.font.size.xl,
            fontWeight: t.font.weight.semibold,
            color: t.color.text.primary,
            letterSpacing: '-0.02em',
            marginBottom: t.space[2],
          }}
        >
          {thread.subject}
        </div>
        <div>
          <span style={{ fontSize: t.font.size.sm, color: t.color.text.secondary }}>
            From:{' '}
            <strong style={{ color: t.color.text.primary, fontWeight: t.font.weight.medium }}>
              {thread.from}
            </strong>{' '}
            <span style={{ color: t.color.text.tertiary }}>&lt;{thread.fromAddress}&gt;</span>
          </span>
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: t.space[6],
        }}
      >
        <p
          style={{
            fontSize: t.font.size.base,
            lineHeight: t.font.lineHeight.relaxed,
            color: t.color.text.primary,
            whiteSpace: 'pre-wrap',
            margin: 0,
          }}
        >
          {thread.body ?? thread.snippet}
        </p>
      </div>

      {/* Reply bar */}
      <div
        style={{
          padding: `${t.space[4]} ${t.space[6]}`,
          borderTop: `1px solid ${t.color.border.subtle}`,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: t.space[2],
            height: '36px',
            padding: `0 ${t.space[4]}`,
            border: `1px solid ${t.color.border.default}`,
            borderRadius: t.radius.md,
            background: 'transparent',
            color: t.color.text.secondary,
            fontSize: t.font.size.sm,
            fontWeight: t.font.weight.medium,
            cursor: 'pointer',
            transition: `background ${t.duration.fast}, color ${t.duration.fast}`,
          }}
          onClick={onReply}
          data-testid="reply-btn"
          title="Reply (R)"
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = t.color.text.primary
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = t.color.bg.hover
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.color = t.color.text.secondary
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'
          }}
        >
          ↩ Reply
          <span
            style={{
              padding: '1px 5px',
              borderRadius: '3px',
              border: '1px solid rgba(255,255,255,0.12)',
              fontSize: '10px',
              lineHeight: '16px',
              color: 'rgba(255,255,255,0.4)',
              fontFamily: t.font.family.mono,
            }}
          >
            R
          </span>
        </button>
      </div>
    </div>
  )
}

/* ── Empty state ─────────────────────────────────────────────── */
function EmptyDetail(): JSX.Element {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: t.space[3],
        backgroundColor: t.color.bg.surface,
        color: t.color.text.tertiary,
      }}
    >
      <div style={{ fontSize: '32px', opacity: 0.4 }}>✉</div>
      <div style={{ fontSize: t.font.size.sm }}>Select a conversation to read</div>
      <div style={{ fontSize: t.font.size.xs, opacity: 0.6 }}>
        Press{' '}
        <span
          style={{
            fontFamily: t.font.family.mono,
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '3px',
            padding: '0 4px',
          }}
        >
          ⌘N
        </span>{' '}
        to compose a new message
      </div>
    </div>
  )
}

/* ── Inner app — uses ComposeContext ─────────────────────────── */
function AppInner({
  setToast,
}: {
  setToast: (v: { message: string; variant: 'success' | 'error' } | null) => void
}): JSX.Element {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const { openCompose, openReply } = useCompose()

  const selectedThread = MOCK_THREADS.find((th) => th.id === selectedThreadId) ?? null

  const handleReply = useCallback(() => {
    if (!selectedThread) return
    openReply({
      replyToThreadId: selectedThread.id,
      replyToMessageId: `${selectedThread.id}-msg-1`,
      replyToAddress: selectedThread.fromAddress,
      replyToSubject: selectedThread.subject,
      replyQuotedBody: selectedThread.body,
    })
  }, [selectedThread, openReply])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      const tag = (e.target as HTMLElement)?.tagName
      const isEditing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'

      // ⌘N — new compose
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        openCompose()
        return
      }

      // R — reply (not in editing context)
      if (e.key === 'r' && !isEditing && !e.metaKey && !e.ctrlKey) {
        if (selectedThread) handleReply()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedThread, openCompose, handleReply])

  // Suppress unused setToast warning — it's used by the parent for send success
  void setToast

  return (
    <div style={appShell}>
      {/* ── Sidebar ── */}
      <nav style={sidebarStyle} aria-label="Mailbox navigation">
        <div style={sidebarTitle}>Genmail</div>
        <button
          type="button"
          style={composeButton}
          onClick={openCompose}
          title="New message (⌘N)"
          data-testid="compose-trigger"
        >
          + Compose
        </button>
        <div style={navItemActive}>
          <span aria-hidden="true">✉</span> Inbox
        </div>
        <div style={navItem}>
          <span aria-hidden="true">⭐</span> Starred
        </div>
        <div style={navItem}>
          <span aria-hidden="true">↗</span> Sent
        </div>
        <div style={navItem}>
          <span aria-hidden="true">📋</span> Drafts
        </div>
      </nav>

      {/* ── Thread list ── */}
      <section style={threadListPane} aria-label="Message list">
        <div style={threadListHeader}>
          <span style={threadListTitle}>Inbox</span>
          <span
            style={{
              fontSize: t.font.size.xs,
              color: t.color.text.tertiary,
              padding: `2px ${t.space[2]}`,
              backgroundColor: t.color.bg.hover,
              borderRadius: t.radius.full,
            }}
          >
            {MOCK_THREADS.filter((th) => th.unread).length} new
          </span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }} role="list" aria-label="Threads">
          {MOCK_THREADS.map((thread) => (
            <ThreadRow
              key={thread.id}
              thread={thread}
              isSelected={thread.id === selectedThreadId}
              onClick={() => setSelectedThreadId(thread.id)}
            />
          ))}
        </div>
      </section>

      {/* ── Detail pane ── */}
      <main style={detailPane} aria-label="Message detail">
        {selectedThread ? (
          <ThreadDetail thread={selectedThread} onReply={handleReply} />
        ) : (
          <EmptyDetail />
        )}
      </main>
    </div>
  )
}

/* ── Root App — provides ComposeProvider ─────────────────────── */
function App(): JSX.Element {
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(
    null
  )

  const handleSendSuccess = useCallback(() => {
    setToast({ message: 'Message sent', variant: 'success' })
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  return (
    <ComposeProvider onSendSuccess={handleSendSuccess}>
      <AppInner setToast={setToast} />
      <ComposeModal accountId={DEFAULT_ACCOUNT_ID} />
      {toast && (
        <Toast message={toast.message} variant={toast.variant} onDismiss={dismissToast} />
      )}
    </ComposeProvider>
  )
}

export default App
