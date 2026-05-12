import type { Message } from '../types'

interface ThreadMetadataBarProps {
  messages: Message[]
  participantNames: string[]
}

function formatDateRange(messages: Message[]): string {
  if (messages.length === 0) return ''
  const dates = messages.map((m) => new Date(m.sentAt).getTime())
  const first = new Date(Math.min(...dates))
  const last = new Date(Math.max(...dates))

  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  if (first.toDateString() === last.toDateString()) {
    return fmt(first)
  }
  return `${fmt(first)} – ${fmt(last)}`
}

export default function ThreadMetadataBar({
  messages,
  participantNames
}: ThreadMetadataBarProps) {
  if (messages.length === 0) return null

  return (
    <div className="flex items-center gap-3 px-6 py-2 bg-neutral-50 border-b border-border">
      <span className="text-2xs text-text-tertiary">
        {messages.length} {messages.length === 1 ? 'message' : 'messages'}
      </span>
      <span className="text-2xs text-text-tertiary">·</span>
      <span className="text-2xs text-text-tertiary truncate">
        {participantNames.join(', ')}
      </span>
      <span className="text-2xs text-text-tertiary">·</span>
      <span className="text-2xs text-text-tertiary flex-shrink-0">
        {formatDateRange(messages)}
      </span>
    </div>
  )
}
