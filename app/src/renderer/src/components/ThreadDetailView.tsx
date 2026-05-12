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

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const loadedForThreadId = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const prevScrollHeightRef = useRef<number>(0)

  useEffect(() => {
    if (
      state.selectedThreadId &&
      loadedForThreadId.current !== state.selectedThreadId
    ) {
      loadedForThreadId.current = state.selectedThreadId
      loadMessages()
    }
  }, [loadMessages, state.selectedThreadId])

  useEffect(() => {
    containerRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    if (!state.messagesLoadingMore && prevScrollHeightRef.current > 0 && scrollContainerRef.current) {
      const newScrollHeight = scrollContainerRef.current.scrollHeight
      const delta = newScrollHeight - prevScrollHeightRef.current
      if (delta > 0) {
        scrollContainerRef.current.scrollTop += delta
      }
      prevScrollHeightRef.current = 0
    }
  }, [state.messagesLoadingMore])

  const handleLoadMore = useCallback(() => {
    if (scrollContainerRef.current) {
      prevScrollHeightRef.current = scrollContainerRef.current.scrollHeight
    }
    loadMoreMessages()
  }, [loadMoreMessages])

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
    const sentinel = topSentinelRef.current
    const scrollContainer = scrollContainerRef.current
    if (!sentinel || !scrollContainer) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          state.messagesHasMore &&
          !state.messagesLoadingMore
        ) {
          handleLoadMore()
        }
      },
      { root: scrollContainer, rootMargin: '80px 0px 0px 0px', threshold: 0 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [state.messagesHasMore, state.messagesLoadingMore, handleLoadMore, state.messages.length])

  const selectedThread = state.threads.find(
    (t) => t.id === state.selectedThreadId
  )

  const handleBack = useCallback(() => {
    navigateToInbox()
  }, [navigateToInbox])

  const participantNames = selectedThread?.participantNames ?? []

  if (state.messagesLoading && state.messages.length === 0) {
    return (
      <div ref={containerRef} tabIndex={-1} className="flex-1 flex flex-col outline-none">
        <div className="sticky top-0 z-10 bg-surface border-b border-border">
          <div className="flex items-center gap-3 px-4 h-12">
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-7 h-7 -ml-1 rounded-md hover:bg-neutral-100 transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-accent-500"
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
      <div ref={containerRef} tabIndex={-1} className="flex-1 flex flex-col outline-none">
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
            <p className="text-xs text-text-tertiary leading-relaxed">{state.messagesError}</p>
            <button
              onClick={retryMessages}
              className="px-3 py-1.5 text-sm font-medium bg-white border border-border text-text-primary rounded-md hover:bg-neutral-50 transition-colors duration-[120ms] shadow-sm"
            >
              Try again
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
      <div ref={containerRef} tabIndex={-1} className="flex-1 flex flex-col outline-none">
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
              This thread has no messages. It may have been deleted or archived.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} tabIndex={-1} className="flex-1 flex flex-col min-h-0 outline-none">
      <HeaderBar subject={selectedThread?.subject} onBack={handleBack} />

      <ThreadMetadataBar
        messages={state.messages}
        participantNames={participantNames}
      />

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto scrollable min-h-0">
        <div ref={topSentinelRef} className="h-px" aria-hidden="true" />

        {state.messagesLoadingMore && (
          <div className="flex items-center justify-center gap-2 py-4 text-xs text-text-tertiary">
            <div className="w-3.5 h-3.5 border-2 border-neutral-200 border-t-accent-500 rounded-full animate-spin" />
            Loading earlier messages
          </div>
        )}

        {!state.messagesLoadingMore && state.messagesHasMore && (
          <div className="flex items-center justify-center py-3">
            <button
              onClick={handleLoadMore}
              className="px-3 py-1.5 text-xs font-medium text-text-secondary bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors duration-[120ms]"
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

        <div className="h-10" />
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
    <div className="sticky top-0 z-10 bg-surface border-b border-border flex-shrink-0">
      <div className="flex items-center gap-2.5 px-4 h-12">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-7 h-7 -ml-1 rounded-md hover:bg-neutral-100 transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-accent-500 flex-shrink-0"
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
        <h1 className="text-sm font-semibold text-text-primary truncate leading-none">
          {subject ?? 'Thread'}
        </h1>
      </div>
    </div>
  )
}
