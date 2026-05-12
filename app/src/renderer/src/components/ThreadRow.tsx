import type { Thread } from '../types'

function formatRelativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  const date = new Date(iso)
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return weekdays[date.getDay()]
}

interface ThreadRowProps {
  thread: Thread
  selected: boolean
  onClick: () => void
}

export default function ThreadRow({
  thread,
  selected,
  onClick
}: ThreadRowProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 transition-colors duration-[120ms] ease-out focus-visible:outline-2 focus-visible:outline-accent-500 focus-visible:outline-offset-[-2px] ${
        selected
          ? 'bg-accent-50'
          : 'hover:bg-neutral-50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 pt-0.5">
          {thread.unread ? (
            <div className="w-2 h-2 rounded-full bg-accent-500 mt-[5px]" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-transparent mt-[5px]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-2 mb-0.5">
            <span
              className={`truncate text-sm ${
                thread.unread
                  ? 'font-semibold text-text-primary'
                  : 'font-medium text-text-primary'
              }`}
            >
              {thread.from.name}
            </span>
            <span className="text-2xs text-text-tertiary whitespace-nowrap flex-shrink-0">
              {formatRelativeTime(thread.lastMessageAt)}
            </span>
          </div>

          <div
            className={`truncate text-sm mb-0.5 ${
              thread.unread
                ? 'font-medium text-text-primary'
                : 'text-text-secondary'
            }`}
          >
            {thread.subject}
          </div>

          <div className="text-xs text-text-tertiary truncate leading-normal">
            {thread.snippet}
          </div>
        </div>
      </div>
    </button>
  )
}
