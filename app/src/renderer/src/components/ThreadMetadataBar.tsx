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

function deduplicateNames(names: string[]): string[] {
  return [...new Set(names)]
}

export default function ThreadMetadataBar({
  messages,
  participantNames
}: ThreadMetadataBarProps) {
  if (messages.length === 0) return null

  const uniqueParticipants = deduplicateNames(participantNames)
  const participantLabel =
    uniqueParticipants.length <= 3
      ? uniqueParticipants.join(', ')
      : `${uniqueParticipants.slice(0, 2).join(', ')} +${uniqueParticipants.length - 2} more`

  return (
    <div className="flex items-center gap-2 px-6 py-2 bg-neutral-50 border-b border-border flex-shrink-0" role="group" aria-label="Thread metadata">
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-2xs font-medium bg-neutral-200/60 text-text-secondary">
        {messages.length} {messages.length === 1 ? 'message' : 'messages'}
      </span>

      <span className="text-neutral-300" aria-hidden="true">·</span>

      <span className="text-2xs text-text-tertiary truncate flex-1 min-w-0" title={uniqueParticipants.join(', ')}>
        {participantLabel}
      </span>

      <span className="text-2xs text-text-tertiary flex-shrink-0">
        {formatDateRange(messages)}
      </span>
    </div>
  )
}
