import type { Message } from '../types'
import { formatRelativeTime, formatAbsoluteTime } from '../lib/time'

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
