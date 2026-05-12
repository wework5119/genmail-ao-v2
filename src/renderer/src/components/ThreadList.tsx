import { useEffect, useRef, useCallback } from 'react'
import { useInbox } from '../context/InboxContext'
import ThreadRow from './ThreadRow'

export default function ThreadList() {
  const { state, selectThread, moveSelection, loadMore, refresh, retry } =
    useInbox()
  const listRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<HTMLDivElement>(null)

  // Global R shortcut — fires regardless of which element has focus,
  // so refresh works even when the list is in empty/loading/error state
  // (those states don't render listRef, so a local listener would never fire).
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey) {
        // Don't hijack R inside text inputs
        const tag = (e.target as HTMLElement)?.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        e.preventDefault()
        refresh()
      }
    },
    [refresh]
  )

  // Local arrow/enter navigation — only meaningful when listbox is focused
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        moveSelection('down')
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        moveSelection('up')
      } else if (e.key === 'Enter' && state.selectedThreadId) {
        e.preventDefault()
      }
    },
    [moveSelection, state.selectedThreadId]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [handleGlobalKeyDown])

  useEffect(() => {
    const el = listRef.current
    if (!el) return

    el.addEventListener('keydown', handleKeyDown)
    return () => el.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    const el = observerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && state.hasMore && !state.loadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [state.hasMore, state.loadingMore, loadMore])

  // Auto-focus the listbox after threads first load so arrow keys work immediately
  useEffect(() => {
    if (!state.loading && state.threads.length > 0 && listRef.current) {
      listRef.current.focus({ preventScroll: true })
    }
  }, [state.loading, state.threads.length])

  useEffect(() => {
    if (state.selectedThreadId && listRef.current) {
      const selectedEl = listRef.current.querySelector(
        `[data-thread-id="${state.selectedThreadId}"]`
      ) as HTMLElement | null
      selectedEl?.scrollIntoView({ block: 'nearest' })
    }
  }, [state.selectedThreadId])

  if (state.loading) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-neutral-400 border-t-accent-600 rounded-full animate-spin" />
          <p className="text-sm text-text-tertiary">Loading threads...</p>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="flex flex-col items-center gap-4 max-w-xs text-center">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-red-600"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 1a7 7 0 100 14A7 7 0 008 1zM7.25 5a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zm.75 6.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-text-primary">
            Failed to load threads
          </p>
          <p className="text-xs text-text-tertiary">{state.error}</p>
          <button
            onClick={retry}
            className="px-3 py-1.5 text-sm font-medium text-accent-600 hover:bg-accent-50 rounded-md transition-colors duration-[120ms]"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (state.threads.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="flex flex-col items-center gap-4 max-w-xs text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-neutral-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <p className="text-sm font-medium text-text-primary">
            No emails yet
          </p>
          <p className="text-xs text-text-tertiary leading-relaxed">
            Your inbox is empty. When you receive emails, they will appear
            here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Section header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">
          Inbox
        </span>
        {state.threads.length > 0 && (
          <span className="text-2xs text-text-tertiary">
            {state.threads.filter((t) => t.unread).length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full bg-accent-600 text-white font-medium text-[10px] leading-none">
                {state.threads.filter((t) => t.unread).length}
              </span>
            )}
          </span>
        )}
      </div>

      <div
        ref={listRef}
        className="flex-1 scrollable"
        tabIndex={0}
        role="listbox"
        aria-label="Thread list"
      >
        {state.threads.map((thread, index) => (
          <div key={thread.id} data-thread-id={thread.id}>
            <ThreadRow
              thread={thread}
              selected={thread.id === state.selectedThreadId}
              onSelect={() => selectThread(thread.id)}
              onDoubleClick={() => {}}
            />
            {index < state.threads.length - 1 && (
              <div className="ml-[44px] mr-0 border-b border-border opacity-60" />
            )}
          </div>
        ))}

        {state.loadingMore && (
          <div className="flex items-center justify-center py-4">
            <div className="w-4 h-4 border-2 border-neutral-400 border-t-accent-600 rounded-full animate-spin" />
          </div>
        )}

        <div ref={observerRef} className="h-px" />
      </div>
    </div>
  )
}
