import type { Message } from '../types'

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

function formatAbsoluteTime(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-accent-blue',
    'bg-accent-green',
    'bg-accent-amber',
    'bg-accent-red'
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

interface MessageHeaderProps {
  message: Message
}

export default function MessageHeader({ message }: MessageHeaderProps) {
  const { from, sentAt, to, cc } = message

  return (
    <div className="flex items-start gap-3">
      <div
        className={`w-8 h-8 rounded-full ${getAvatarColor(from.name)} flex items-center justify-center flex-shrink-0 mt-0.5`}
      >
        <span className="text-xs font-medium text-white leading-none">
          {getInitials(from.name)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-text-primary truncate">
            {from.name}
          </span>
          <span
            className="text-2xs text-text-tertiary whitespace-nowrap flex-shrink-0"
            title={formatAbsoluteTime(sentAt)}
          >
            {formatRelativeTime(sentAt)}
          </span>
        </div>
        <div className="text-2xs text-text-tertiary truncate mt-0.5">
          <span>to {to.map((t) => t.name || t.address).join(', ')}</span>
          {cc && cc.length > 0 && (
            <span className="ml-1">
              cc {cc.map((c) => c.name || c.address).join(', ')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
