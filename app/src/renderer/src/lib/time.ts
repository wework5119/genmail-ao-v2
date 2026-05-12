/**
 * Format a timestamp as a human-readable relative string.
 * - < 1 min  → "now"
 * - < 1 hr   → "Xm ago"
 * - < 24 hr  → "Xh ago"
 * - < 7 days → "Xd ago"
 * - ≥ 7 days → full short date ("Mar 1" or "Mar 1, 2023" if not current year)
 */
export function formatRelativeTime(iso: string): string {
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
  const currentYear = new Date().getFullYear()
  if (date.getFullYear() === currentYear) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Format a timestamp as a full human-readable absolute string for tooltips.
 */
export function formatAbsoluteTime(iso: string): string {
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
