import { useState, useRef, useEffect } from 'react'
import { useInbox } from '../context/InboxContext'

export default function AccountPicker() {
  const { state, selectAccount } = useInbox()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = state.accounts.find(
    (a) => a.id === state.selectedAccountId
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-neutral-100 transition-colors duration-[120ms] ease-out focus-visible:outline-2 focus-visible:outline-accent-500 w-full text-left"
      >
        <div className="w-5 h-5 rounded-full bg-accent-500 flex items-center justify-center flex-shrink-0">
          <span className="text-[11px] font-medium text-white leading-none">
            {selected?.name?.charAt(0) ?? '?'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-text-primary truncate leading-normal">
            {selected?.name ?? 'Select account'}
          </div>
          <div className="text-2xs text-text-tertiary leading-tight truncate">
            {selected?.email ?? ''}
          </div>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-text-tertiary transition-transform duration-[120ms] ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface rounded-lg shadow-elevated border border-border py-1 z-50">
          {state.accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => {
                selectAccount(account.id)
                setOpen(false)
              }}
              className={`flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors duration-[120ms] ${
                account.id === state.selectedAccountId
                  ? 'bg-accent-50'
                  : 'hover:bg-neutral-50'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-accent-500 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-white leading-none">
                  {account.name.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate leading-normal">
                  {account.name}
                </div>
                <div className="text-2xs text-text-tertiary truncate leading-tight">
                  {account.email}
                </div>
              </div>
              {account.id === state.selectedAccountId && (
                <svg
                  className="w-4 h-4 text-accent-500 flex-shrink-0"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
