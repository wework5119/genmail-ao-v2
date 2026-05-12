import React, { useEffect, useCallback } from 'react'
import { InboxProvider, useInbox } from './context/InboxContext'
import AccountPicker from './components/AccountPicker'
import ThreadList from './components/ThreadList'
import ThreadDetailView from './components/ThreadDetailView'
import SearchOverlay from './components/SearchOverlay'

function AppShell(): JSX.Element {
  const { state, openSearch, closeSearch } = useInbox()

  // ⌘+F / ⌘+K opens search overlay
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey
      if (meta && (e.key === 'f' || e.key === 'k')) {
        e.preventDefault()
        if (!state.searchOpen) {
          openSearch()
        }
      }
    },
    [state.searchOpen, openSearch]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [handleGlobalKeyDown])

  return (
    <div className="flex h-screen bg-surface text-text-primary overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 flex flex-col border-r border-border bg-surface flex-shrink-0">
        {/* Sidebar header */}
        <div className="px-3 pt-3 pb-2 border-b border-border">
          <AccountPicker />
        </div>

        {/* Inbox label + search trigger */}
        <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
          <span className="text-2xs font-semibold text-text-tertiary uppercase tracking-wider">
            Inbox
          </span>
          {/* Search button in sidebar header */}
          <button
            type="button"
            onClick={openSearch}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md text-2xs text-text-tertiary hover:bg-neutral-100 hover:text-text-secondary transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-accent-500"
            aria-label="Search mail (⌘K)"
            title="Search mail (⌘K)"
          >
            <svg
              className="w-3 h-3"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="5" cy="5" r="3.5" />
              <line x1="8" y1="8" x2="11" y2="11" />
            </svg>
            <kbd className="font-mono">⌘K</kbd>
          </button>
        </div>

        {/* Thread list */}
        <ThreadList />
      </aside>

      {/* Content area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {state.view === 'thread' ? (
          <ThreadDetailView />
        ) : (
          <EmptyContentArea onOpenSearch={openSearch} />
        )}
      </main>

      {/* Search overlay — rendered at root level so it covers everything */}
      {state.searchOpen && (
        <SearchOverlay onClose={closeSearch} />
      )}
    </div>
  )
}

function EmptyContentArea({ onOpenSearch }: { onOpenSearch: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 max-w-xs text-center">
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
        <p className="text-sm text-text-secondary">
          Select a thread to read
        </p>
        <p className="text-xs text-text-tertiary leading-relaxed">
          Press{' '}
          <kbd className="px-1 py-0.5 text-xs font-mono bg-neutral-100 rounded border border-border">↑</kbd>{' '}
          <kbd className="px-1 py-0.5 text-xs font-mono bg-neutral-100 rounded border border-border">↓</kbd>{' '}
          to navigate,{' '}
          <kbd className="px-1 py-0.5 text-xs font-mono bg-neutral-100 rounded border border-border">Enter</kbd>{' '}
          to open
        </p>
        <button
          type="button"
          onClick={onOpenSearch}
          className="mt-2 flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary bg-neutral-50 hover:bg-neutral-100 border border-border rounded-md transition-colors duration-[120ms]"
        >
          <svg
            className="w-3.5 h-3.5 text-neutral-400"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="6" cy="6" r="4.5" />
            <line x1="9.5" y1="9.5" x2="13" y2="13" />
          </svg>
          Search mail
          <kbd className="font-mono text-neutral-400">⌘K</kbd>
        </button>
      </div>
    </div>
  )
}

function App(): JSX.Element {
  return (
    <InboxProvider>
      <AppShell />
    </InboxProvider>
  )
}

export default App
