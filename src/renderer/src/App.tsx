import AccountPicker from './components/AccountPicker'
import ThreadList from './components/ThreadList'

export default function App() {
  return (
    <div className="h-screen flex flex-col bg-surface select-none overflow-hidden">
      {/* macOS traffic-light drag region — 28px tall, full width */}
      <div
        className="flex-shrink-0 h-7 bg-surface"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />

      {/* Account picker — no drag region so it stays clickable */}
      <header
        className="flex-shrink-0 px-3 pb-1"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <AccountPicker />
      </header>

      {/* Thread list takes remaining height */}
      <div className="flex-1 flex flex-col min-h-0">
        <ThreadList />
      </div>
    </div>
  )
}
