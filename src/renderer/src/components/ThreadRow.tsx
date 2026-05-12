import type { Thread } from '../types'

function formatRelativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  if (hours < 24) return `${hours}h`
  if (days < 7) {
    const date = new Date(iso)
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return weekdays[date.getDay()]
  }

  const date = new Date(iso)
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
  return `${months[date.getMonth()]} ${date.getDate()}`
}

interface ThreadRowProps {
  thread: Thread
  selected: boolean
  onSelect: () => void
  onDoubleClick: () => void
}

export default function ThreadRow({
  thread,
  selected,
  onSelect,
  onDoubleClick
}: ThreadRowProps) {
  return (
    <button
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      aria-selected={selected}
      className={`w-full text-left px-4 py-[10px] transition-colors duration-[120ms] ease-out focus-visible:outline-2 focus-visible:outline-accent-500 focus-visible:outline-offset-[-2px] ${
        selected
          ? 'bg-accent-50'
          : 'hover:bg-neutral-50'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Unread dot — fixed 16px wide gutter so text alignment is consistent */}
        <div className="flex-shrink-0 w-2 flex justify-center pt-[5px]">
          {thread.unread && (
            <div className="w-[7px] h-[7px] rounded-full bg-accent-600" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Row 1: Sender name + timestamp */}
          <div className="flex items-baseline justify-between gap-2 mb-[3px]">
            <span
              className={`truncate text-sm leading-[20px] ${
                thread.unread
                  ? 'font-semibold text-text-primary'
                  : 'font-medium text-text-secondary'
              }`}
            >
              {thread.from.name}
            </span>
            <span className="text-2xs text-text-tertiary whitespace-nowrap flex-shrink-0 leading-[20px]">
              {formatRelativeTime(thread.lastMessageAt)}
            </span>
          </div>

          {/* Row 2: Subject */}
          <div
            className={`truncate text-sm leading-[18px] mb-[2px] ${
              thread.unread
                ? 'font-medium text-text-primary'
                : 'text-text-secondary'
            }`}
          >
            {thread.subject}
          </div>

          {/* Row 3: Snippet + optional attachment icon */}
          <div className="flex items-center gap-1.5">
            <div className="flex-1 min-w-0 text-xs text-text-tertiary truncate leading-[17px]">
              {thread.snippet}
            </div>
            {thread.hasAttachments && (
              <svg
                className="w-3 h-3 text-text-tertiary flex-shrink-0"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M8 0a5.5 5.5 0 00-5.5 5.5v6a4 4 0 108 0V6a2.5 2.5 0 00-5 0v5.5a1 1 0 102 0V6a.5.5 0 011 0v5.5a3 3 0 01-6 0V5.5a5.5 5.5 0 1111 0v6h-2V5.5A3.5 3.5 0 008 0z" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
