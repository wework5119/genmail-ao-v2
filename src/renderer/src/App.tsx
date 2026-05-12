import AccountPicker from './components/AccountPicker'
import ThreadList from './components/ThreadList'

export default function App() {
  return (
    <div className="h-screen flex flex-col bg-surface select-none">
      <header className="flex-shrink-0 px-3 pt-3 pb-1">
        <AccountPicker />
      </header>

      <div className="flex-1 flex flex-col min-h-0">
        <ThreadList />
      </div>
    </div>
  )
}
