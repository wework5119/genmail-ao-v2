import { InboxProvider, useInbox } from './context/InboxContext'
import AccountPicker from './components/AccountPicker'
import ThreadList from './components/ThreadList'
import ThreadDetailView from './components/ThreadDetailView'

function AppShell(): JSX.Element {
  const { state } = useInbox()

  return (
    <div className="flex h-screen bg-surface text-text-primary overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 flex flex-col border-r border-border bg-surface flex-shrink-0">
        {/* Sidebar header */}
        <div className="px-3 pt-3 pb-2 border-b border-border">
          <AccountPicker />
        </div>

        {/* Inbox label */}
        <div className="px-4 pt-3 pb-1.5">
          <span className="text-2xs font-semibold text-text-tertiary uppercase tracking-wider">
            Inbox
          </span>
        </div>

        {/* Thread list */}
        <ThreadList />
      </aside>

      {/* Content area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {state.view === 'thread' ? (
          <ThreadDetailView />
        ) : (
          <EmptyContentArea />
        )}
      </main>
    </div>
  )
}

function EmptyContentArea(): JSX.Element {
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
          Press <kbd className="px-1 py-0.5 text-xs font-mono bg-neutral-100 rounded border border-border">↑</kbd>{' '}
          <kbd className="px-1 py-0.5 text-xs font-mono bg-neutral-100 rounded border border-border">↓</kbd>{' '}
          to navigate, <kbd className="px-1 py-0.5 text-xs font-mono bg-neutral-100 rounded border border-border">Enter</kbd> to open
        </p>
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
