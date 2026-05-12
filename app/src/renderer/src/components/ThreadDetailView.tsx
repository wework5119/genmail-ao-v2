import { useEffect, useRef, useCallback } from 'react'
import { useInbox } from '../context/InboxContext'
import MessageHeader from './MessageHeader'
import MessageBody from './MessageBody'
import ThreadMetadataBar from './ThreadMetadataBar'
import SkeletonLoader from './SkeletonLoader'

export default function ThreadDetailView() {
  const {
    state,
    loadMessages,
    loadMoreMessages,
    retryMessages,
    navigateToInbox
  } = useInbox()

  const scrollRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const loadedForThreadId = useRef<string | null>(null)

  useEffect(() => {
    // Load messages when component mounts or when selectedThreadId changes to a new thread
    if (
      state.selectedThreadId &&
      loadedForThreadId.current !== state.selectedThreadId
    ) {
      loadedForThreadId.current = state.selectedThreadId
      loadMessages()
    }
  }, [loadMessages, state.selectedThreadId])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        navigateToInbox()
      }
    },
    [navigateToInbox]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    const el = topSentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          state.messagesHasMore &&
          !state.messagesLoadingMore
        ) {
          loadMoreMessages()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [state.messagesHasMore, state.messagesLoadingMore, loadMoreMessages])

  const selectedThread = state.threads.find(
    (t) => t.id === state.selectedThreadId
  )

  const handleBack = useCallback(() => {
    navigateToInbox()
  }, [navigateToInbox])

  const participantNames = selectedThread?.participantNames ?? []

  if (state.messagesLoading && state.messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="sticky top-0 z-10 bg-surface border-b border-border">
          <div className="flex items-center gap-3 px-4 h-12">
            <button
              onClick={handleBack}
              className="p-1.5 -ml-1.5 rounded-md hover:bg-neutral-100 transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-accent-500"
              aria-label="Back to inbox (Escape)"
              title="Back to inbox (Esc)"
            >
              <svg
                className="w-4 h-4 text-text-secondary"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 12L6 8l4-4" />
              </svg>
            </button>
            <div className="h-4 bg-skeleton-base rounded w-48 animate-pulse" />
          </div>
        </div>
        <SkeletonLoader count={3} />
      </div>
    )
  }

  if (state.messagesError && state.messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <HeaderBar subject={selectedThread?.subject} onBack={handleBack} />
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="flex flex-col items-center gap-4 max-w-xs text-center">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-red-500"
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
              Failed to load messages
            </p>
            <p className="text-xs text-text-tertiary">{state.messagesError}</p>
            <button
              onClick={retryMessages}
              className="px-3 py-1.5 text-sm font-medium text-accent-blue hover:bg-accent-blueLight rounded-md transition-colors duration-[120ms]"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (
    !state.messagesLoading &&
    state.messages.length === 0 &&
    !state.messagesError
  ) {
    return (
      <div className="flex-1 flex flex-col">
        <HeaderBar subject={selectedThread?.subject} onBack={handleBack} />
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
              No messages
            </p>
            <p className="text-xs text-text-tertiary leading-relaxed">
              This thread has no messages. It may have been deleted or
              archived.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col" ref={scrollRef}>
      <HeaderBar subject={selectedThread?.subject} onBack={handleBack} />

      <ThreadMetadataBar
        messages={state.messages}
        participantNames={participantNames}
      />

      <div className="flex-1 overflow-y-auto scrollable">
        <div ref={topSentinelRef} className="h-px" />

        {state.messagesLoadingMore && (
          <div className="flex items-center justify-center py-4">
            <div className="w-4 h-4 border-2 border-neutral-200 border-t-accent-blue rounded-full animate-spin" />
          </div>
        )}

        {!state.messagesLoadingMore && state.messagesHasMore && (
          <div className="flex items-center justify-center py-3 border-b border-border">
            <button
              onClick={loadMoreMessages}
              className="px-3 py-1.5 text-xs font-medium text-accent-blue hover:bg-accent-blueLight rounded-md transition-colors duration-[120ms]"
            >
              Load earlier messages
            </button>
          </div>
        )}

        <div className="divide-y divide-border">
          {state.messages.map((message) => (
            <article key={message.id} className="px-6 py-5">
              <div className="mb-3">
                <MessageHeader message={message} />
              </div>
              <div className="ml-11">
                <MessageBody message={message} />
              </div>
            </article>
          ))}
        </div>

        <div className="h-8" />
      </div>
    </div>
  )
}

function HeaderBar({
  subject,
  onBack
}: {
  subject?: string
  onBack: () => void
}) {
  return (
    <div className="sticky top-0 z-10 bg-surface border-b border-border">
      <div className="flex items-center gap-3 px-4 h-12">
        <button
          onClick={onBack}
          className="p-1.5 -ml-1.5 rounded-md hover:bg-neutral-100 transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-accent-500"
          aria-label="Back to inbox"
          title="Back to inbox (Esc)"
        >
          <svg
            className="w-4 h-4 text-text-secondary"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 12L6 8l4-4" />
          </svg>
        </button>
        <h1 className="text-sm font-semibold text-text-primary truncate">
          {subject ?? 'Thread'}
        </h1>
      </div>
    </div>
  )
}
