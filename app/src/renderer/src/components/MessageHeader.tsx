import type { Message } from '../types'
import { formatRelativeTime, formatAbsoluteTime } from '../lib/time'

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
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

  const toLabel = to.map((r) => r.name || r.address).join(', ')
  const ccLabel = cc && cc.length > 0 ? cc.map((r) => r.name || r.address).join(', ') : null

  return (
    <div className="flex items-start gap-3">
      <div
        className={`w-8 h-8 rounded-full ${getAvatarColor(from.name || from.address)} flex items-center justify-center flex-shrink-0 mt-0.5`}
        aria-hidden="true"
      >
        <span className="text-xs font-semibold text-white leading-none select-none">
          {getInitials(from.name || from.address)}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold text-text-primary truncate leading-snug">
            {from.name || from.address}
          </span>
          <time
            className="text-2xs text-text-tertiary whitespace-nowrap flex-shrink-0 tabular-nums"
            dateTime={sentAt}
            title={formatAbsoluteTime(sentAt)}
          >
            {formatRelativeTime(sentAt)}
          </time>
        </div>

        <div className="flex items-center gap-1 mt-0.5 text-2xs text-text-tertiary truncate">
          <span className="text-neutral-400">to</span>
          <span className="truncate">{toLabel}</span>
          {ccLabel && (
            <>
              <span className="text-neutral-300 flex-shrink-0">·</span>
              <span className="text-neutral-400 flex-shrink-0">cc</span>
              <span className="truncate">{ccLabel}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
