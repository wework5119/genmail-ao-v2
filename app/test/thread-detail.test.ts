import { describe, it, expect } from 'vitest'
import type { Message, MessageList } from '../src/ipc/channels'
import type { Thread, GetMessagesResult, GetMessagesParams } from '../src/renderer/src/types'

// ─── Helper factories ───────────────────────────────────────────────────────

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'msg-1',
    threadId: 'thread-1',
    accountId: 'acc-1',
    subject: 'Re: Meeting tomorrow',
    from: { name: 'Alice Johnson', address: 'alice@example.com' },
    to: [{ name: 'Bob Smith', address: 'bob@example.com' }],
    cc: [],
    body: 'See you at 10am!',
    bodyType: 'text',
    sentAt: '2024-03-01T10:00:00Z',
    receivedAt: '2024-03-01T10:00:05Z',
    isRead: false,
    ...overrides
  }
}

function makeThread(overrides: Partial<Thread> = {}): Thread {
  return {
    id: 'thread-1',
    subject: 'Meeting tomorrow',
    snippet: 'See you at 10am!',
    lastMessageDate: '2024-03-01T10:00:00Z',
    participantNames: ['Alice Johnson', 'Bob Smith'],
    unreadCount: 1,
    accountId: 'acc-1',
    from: { name: 'Alice Johnson', email: 'alice@example.com' },
    to: [],
    unread: true,
    hasAttachments: false,
    labels: [],
    ...overrides
  }
}

// ─── IPC channel shape ───────────────────────────────────────────────────────

describe('getMessages IPC channel', () => {
  it('MessageList has required fields', () => {
    const list: MessageList = {
      messages: [],
      hasMore: false
    }
    expect(list.messages).toEqual([])
    expect(list.hasMore).toBe(false)
    expect(list.nextPageToken).toBeUndefined()
  })

  it('MessageList with pagination token', () => {
    const list: MessageList = {
      messages: [makeMessage()],
      nextPageToken: 'page-2',
      hasMore: true
    }
    expect(list.messages).toHaveLength(1)
    expect(list.nextPageToken).toBe('page-2')
    expect(list.hasMore).toBe(true)
  })

  it('Message has required thread fields', () => {
    const msg = makeMessage()
    expect(msg.id).toBe('msg-1')
    expect(msg.threadId).toBe('thread-1')
    expect(msg.from.name).toBe('Alice Johnson')
    expect(msg.bodyType).toBe('text')
  })

  it('Message supports html bodyType', () => {
    const msg = makeMessage({ bodyType: 'html', body: '<p>Hello</p>' })
    expect(msg.bodyType).toBe('html')
  })

  it('Message supports cc and attachments', () => {
    const msg = makeMessage({
      cc: [{ name: 'Charlie', address: 'charlie@example.com' }],
      attachments: [{ id: 'att-1', filename: 'file.pdf', mimeType: 'application/pdf', sizeBytes: 1024 }]
    })
    expect(msg.cc).toHaveLength(1)
    expect(msg.attachments).toHaveLength(1)
    expect(msg.attachments![0].filename).toBe('file.pdf')
  })
})

// ─── GetMessagesParams type ──────────────────────────────────────────────────

describe('GetMessagesParams renderer type', () => {
  it('accepts accountId and threadId with optional pageParams', () => {
    const params: GetMessagesParams = {
      accountId: 'acc-1',
      threadId: 'thread-1'
    }
    expect(params.accountId).toBe('acc-1')
    expect(params.threadId).toBe('thread-1')
    expect(params.pageParams).toBeUndefined()
  })

  it('accepts pageParams with pageSize', () => {
    const params: GetMessagesParams = {
      accountId: 'acc-1',
      threadId: 'thread-1',
      pageParams: { pageSize: 20, pageToken: 'tok-abc' }
    }
    expect(params.pageParams?.pageSize).toBe(20)
    expect(params.pageParams?.pageToken).toBe('tok-abc')
  })
})

// ─── GetMessagesResult renderer type ────────────────────────────────────────

describe('GetMessagesResult renderer type', () => {
  it('has messages, hasMore, and optional nextPageToken', () => {
    const result: GetMessagesResult = {
      messages: [makeMessage()],
      hasMore: false
    }
    expect(result.messages).toHaveLength(1)
    expect(result.hasMore).toBe(false)
  })

  it('hasMore is true when nextPageToken is present', () => {
    const result: GetMessagesResult = {
      messages: [makeMessage(), makeMessage({ id: 'msg-2' })],
      nextPageToken: 'page-2',
      hasMore: true
    }
    expect(result.hasMore).toBe(true)
    expect(result.nextPageToken).toBe('page-2')
    expect(result.messages).toHaveLength(2)
  })
})

// ─── Thread type ─────────────────────────────────────────────────────────────

describe('Thread type', () => {
  it('has correct shape from ThreadSummary extension', () => {
    const thread = makeThread()
    expect(thread.id).toBe('thread-1')
    expect(thread.subject).toBe('Meeting tomorrow')
    expect(thread.participantNames).toContain('Alice Johnson')
    expect(thread.unread).toBe(true)
    expect(thread.from.name).toBe('Alice Johnson')
  })

  it('unread is derived from unreadCount', () => {
    const read = makeThread({ unreadCount: 0, unread: false })
    const unread = makeThread({ unreadCount: 2, unread: true })
    expect(read.unread).toBe(false)
    expect(unread.unread).toBe(true)
  })

  it('labels and hasAttachments default correctly', () => {
    const thread = makeThread()
    expect(thread.labels).toEqual([])
    expect(thread.hasAttachments).toBe(false)
  })
})

// ─── Message chronological ordering logic ───────────────────────────────────

describe('Message ordering', () => {
  it('messages sort chronologically by sentAt (oldest first)', () => {
    const messages: Message[] = [
      makeMessage({ id: 'msg-3', sentAt: '2024-03-01T12:00:00Z' }),
      makeMessage({ id: 'msg-1', sentAt: '2024-03-01T09:00:00Z' }),
      makeMessage({ id: 'msg-2', sentAt: '2024-03-01T10:30:00Z' })
    ]

    const sorted = [...messages].sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
    )

    expect(sorted[0].id).toBe('msg-1')
    expect(sorted[1].id).toBe('msg-2')
    expect(sorted[2].id).toBe('msg-3')
  })

  it('single message list is already ordered', () => {
    const messages: Message[] = [makeMessage()]
    const sorted = [...messages].sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
    )
    expect(sorted).toHaveLength(1)
    expect(sorted[0].id).toBe('msg-1')
  })
})

// ─── HTML sanitization logic (pure string tests) ────────────────────────────

describe('HTML body detection', () => {
  it('detects HTML bodyType', () => {
    const msg = makeMessage({ bodyType: 'html', body: '<p>Hello</p>' })
    expect(msg.bodyType).toBe('html')
  })

  it('detects text bodyType', () => {
    const msg = makeMessage({ bodyType: 'text', body: 'Plain text email' })
    expect(msg.bodyType).toBe('text')
  })

  it('detects images in HTML body', () => {
    const body = '<p>Hello</p><img src="https://example.com/img.png" />'
    const hasImages = /<img[^>]+src=["']/i.test(body)
    expect(hasImages).toBe(true)
  })

  it('detects no images in HTML without img tags', () => {
    const body = '<p>Hello world</p><a href="#">click</a>'
    const hasImages = /<img[^>]+src=["']/i.test(body)
    expect(hasImages).toBe(false)
  })
})

// ─── Date range formatting logic ─────────────────────────────────────────────

describe('Thread date range computation', () => {
  function formatDateRange(messages: Message[]): string {
    if (messages.length === 0) return ''
    const dates = messages.map((m) => new Date(m.sentAt).getTime())
    const first = new Date(Math.min(...dates))
    const last = new Date(Math.max(...dates))
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (first.toDateString() === last.toDateString()) return fmt(first)
    return `${fmt(first)} – ${fmt(last)}`
  }

  it('returns empty string for empty messages', () => {
    expect(formatDateRange([])).toBe('')
  })

  it('returns single date when all messages are same day', () => {
    const messages = [
      makeMessage({ id: 'msg-1', sentAt: '2024-03-01T09:00:00Z' }),
      makeMessage({ id: 'msg-2', sentAt: '2024-03-01T14:00:00Z' })
    ]
    const range = formatDateRange(messages)
    expect(range).not.toContain('–')
  })

  it('returns date range when messages span multiple days', () => {
    const messages = [
      makeMessage({ id: 'msg-1', sentAt: '2024-03-01T09:00:00Z' }),
      makeMessage({ id: 'msg-2', sentAt: '2024-03-05T14:00:00Z' })
    ]
    const range = formatDateRange(messages)
    expect(range).toContain('–')
  })
})

// ─── Relative timestamp formatting (shared lib/time.ts logic) ──────────────

describe('Relative timestamp formatting', () => {
  /**
   * Local replica of the shared formatRelativeTime logic for unit-testing
   * without importing the renderer module.
   */
  function formatRelativeTime(iso: string, nowMs: number): string {
    const then = new Date(iso).getTime()
    const diff = nowMs - then
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`

    // ≥ 7 days: short date (e.g. "Feb 27") or with year if different
    const date = new Date(iso)
    const currentYear = new Date(nowMs).getFullYear()
    if (date.getFullYear() === currentYear) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const now = new Date('2024-03-05T12:00:00Z').getTime()

  it('returns "now" for very recent messages', () => {
    const iso = '2024-03-05T11:59:45Z'
    expect(formatRelativeTime(iso, now)).toBe('now')
  })

  it('returns minutes ago for messages within an hour', () => {
    const iso = '2024-03-05T11:30:00Z'
    expect(formatRelativeTime(iso, now)).toBe('30m ago')
  })

  it('returns hours ago for messages within 24 hours', () => {
    const iso = '2024-03-05T09:00:00Z'
    expect(formatRelativeTime(iso, now)).toBe('3h ago')
  })

  it('returns days ago for messages within a week', () => {
    const iso = '2024-03-03T12:00:00Z'
    expect(formatRelativeTime(iso, now)).toBe('2d ago')
  })

  it('returns short date (e.g. "Feb 27") for messages older than a week (same year)', () => {
    const iso = '2024-02-27T12:00:00Z'
    const result = formatRelativeTime(iso, now)
    // Should be a short month+day, not a weekday abbreviation
    expect(result).toMatch(/^[A-Z][a-z]+ \d+$/)
    expect(result).not.toMatch(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/)
  })

  it('returns date with year for messages from a prior year', () => {
    const iso = '2023-02-27T12:00:00Z'
    const result = formatRelativeTime(iso, now)
    expect(result).toContain('2023')
  })
})

// ─── Avatar initials logic ───────────────────────────────────────────────────

describe('Avatar initials', () => {
  function getInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  it('returns two initials for a full name', () => {
    expect(getInitials('Alice Johnson')).toBe('AJ')
  })

  it('returns one initial for a single name', () => {
    expect(getInitials('Alice')).toBe('A')
  })

  it('truncates to two characters max', () => {
    expect(getInitials('Alice Bob Charlie')).toBe('AB')
  })

  it('uppercases the initials', () => {
    expect(getInitials('alice smith')).toBe('AS')
  })

  it('handles names with extra spaces (filter(Boolean) prevents empty splits)', () => {
    expect(getInitials('  Alice  Smith  ')).toBe('AS')
  })
})

// ─── Pagination sentinel logic ───────────────────────────────────────────────

describe('Pagination state', () => {
  it('hasMore is false when nextPageToken is absent', () => {
    const result: GetMessagesResult = { messages: [], hasMore: false }
    expect(result.hasMore).toBe(false)
    expect(result.nextPageToken).toBeUndefined()
  })

  it('hasMore is true when nextPageToken is present', () => {
    const result: GetMessagesResult = {
      messages: [makeMessage()],
      nextPageToken: 'tok-abc',
      hasMore: true
    }
    expect(result.hasMore).toBe(true)
  })

  it('load-more prepends older messages to current list', () => {
    const existing: Message[] = [makeMessage({ id: 'msg-3', sentAt: '2024-03-01T12:00:00Z' })]
    const older: Message[] = [makeMessage({ id: 'msg-1', sentAt: '2024-03-01T09:00:00Z' })]
    const combined = [...older, ...existing]
    expect(combined[0].id).toBe('msg-1')
    expect(combined[1].id).toBe('msg-3')
  })
})

// ─── Stale-response guard logic ───────────────────────────────────────────────

describe('Stale async response guard', () => {
  /**
   * Mirrors the LOAD_MESSAGES_SUCCESS reducer logic that guards against
   * stale in-flight responses when the user navigates to a different thread.
   */
  function applyLoadMessagesSuccess(
    selectedThreadId: string | null,
    payloadThreadId: string,
    payloadMessages: Message[]
  ): { applied: boolean; messages: Message[] } {
    // Simulate the reducer staleness check
    if (payloadThreadId !== selectedThreadId) {
      return { applied: false, messages: [] }
    }
    const sorted = [...payloadMessages].sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
    )
    return { applied: true, messages: sorted }
  }

  it('applies result when threadId matches selected thread', () => {
    const msgs = [makeMessage({ id: 'msg-1' })]
    const { applied, messages } = applyLoadMessagesSuccess('thread-1', 'thread-1', msgs)
    expect(applied).toBe(true)
    expect(messages).toHaveLength(1)
  })

  it('discards result when threadId does not match selected thread (stale)', () => {
    const msgs = [makeMessage({ id: 'msg-1' })]
    const { applied } = applyLoadMessagesSuccess('thread-2', 'thread-1', msgs)
    expect(applied).toBe(false)
  })

  it('discards result when selected thread is null (navigated away)', () => {
    const msgs = [makeMessage({ id: 'msg-1' })]
    const { applied } = applyLoadMessagesSuccess(null, 'thread-1', msgs)
    expect(applied).toBe(false)
  })

  it('discards failure when threadId does not match current thread (stale failure guard)', () => {
    /**
     * Mirrors the LOAD_MESSAGES_FAILURE stale guard: if the failing request was
     * for a different thread than the currently selected one, the reducer must
     * return state unchanged so the current thread's loading/error state is preserved.
     */
    function applyLoadMessagesFailure(
      selectedThreadId: string | null,
      payloadThreadId: string,
      currentMessagesLoading: boolean
    ): { applied: boolean; messagesLoading: boolean; messagesError: string | null } {
      // Mirrors the reducer guard
      if (payloadThreadId !== selectedThreadId) {
        return { applied: false, messagesLoading: currentMessagesLoading, messagesError: null }
      }
      return { applied: true, messagesLoading: false, messagesError: 'Network error' }
    }

    // Stale failure (thread A failed, but thread B is now selected) — should not apply
    const stale = applyLoadMessagesFailure('thread-2', 'thread-1', true)
    expect(stale.applied).toBe(false)
    // Loading flag must remain true — thread B's request is still in flight
    expect(stale.messagesLoading).toBe(true)
    expect(stale.messagesError).toBeNull()

    // Non-stale failure (same thread) — should apply
    const current = applyLoadMessagesFailure('thread-1', 'thread-1', true)
    expect(current.applied).toBe(true)
    expect(current.messagesLoading).toBe(false)
    expect(current.messagesError).toBe('Network error')

    // Null selected thread (navigated away completely) — should not apply
    const navigatedAway = applyLoadMessagesFailure(null, 'thread-1', false)
    expect(navigatedAway.applied).toBe(false)
  })

  it('discards load-more result when threadId does not match current thread (stale)', () => {
    /**
     * Mirrors the LOAD_MORE_MESSAGES_SUCCESS stale guard added to the reducer.
     */
    function applyLoadMoreMessagesSuccess(
      selectedThreadId: string | null,
      payloadThreadId: string,
      existing: Message[],
      older: Message[]
    ): { applied: boolean; messages: Message[] } {
      if (payloadThreadId !== selectedThreadId) {
        return { applied: false, messages: existing }
      }
      const combined = [...older, ...existing].sort(
        (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      )
      return { applied: true, messages: combined }
    }

    const existing = [makeMessage({ id: 'msg-3', sentAt: '2024-03-01T12:00:00Z' })]
    const older = [makeMessage({ id: 'msg-1', sentAt: '2024-03-01T09:00:00Z' })]

    const stale = applyLoadMoreMessagesSuccess('thread-2', 'thread-1', existing, older)
    expect(stale.applied).toBe(false)
    // Existing messages should be untouched
    expect(stale.messages).toHaveLength(1)
    expect(stale.messages[0].id).toBe('msg-3')

    const current = applyLoadMoreMessagesSuccess('thread-1', 'thread-1', existing, older)
    expect(current.applied).toBe(true)
    expect(current.messages).toHaveLength(2)
    expect(current.messages[0].id).toBe('msg-1')
  })
})

// ─── Sanitizer attribute stripping logic ─────────────────────────────────────

describe('HTML sanitization — attribute policy', () => {
  /**
   * Mirrors the attribute-stripping logic from sanitizeHtml without DOMParser
   * (not available in Node test environment). Tests the decision logic.
   */
  function shouldStripAttr(attrName: string, attrValue: string): boolean {
    const name = attrName.toLowerCase()
    const value = attrValue.toLowerCase().trimStart()
    if (name.startsWith('on')) return true
    if (name === 'style') return true
    if (value.startsWith('javascript:')) return true
    if (value.startsWith('vbscript:')) return true
    if (value.startsWith('data:')) return true
    return false
  }

  it('strips event handler attributes (onclick)', () => {
    expect(shouldStripAttr('onclick', 'alert(1)')).toBe(true)
  })

  it('strips event handler attributes (onload)', () => {
    expect(shouldStripAttr('onload', 'malicious()')).toBe(true)
  })

  it('strips inline style attributes to prevent CSS url() tracking', () => {
    expect(shouldStripAttr('style', 'background-image: url(https://tracker.com)')).toBe(true)
  })

  it('strips href with javascript: URI', () => {
    expect(shouldStripAttr('href', 'javascript:alert(1)')).toBe(true)
  })

  it('strips src with data: URI', () => {
    expect(shouldStripAttr('src', 'data:text/html,<script>bad()</script>')).toBe(true)
  })

  it('strips href with vbscript: URI', () => {
    expect(shouldStripAttr('href', 'vbscript:msgbox(1)')).toBe(true)
  })

  it('allows safe href attributes', () => {
    expect(shouldStripAttr('href', 'https://example.com')).toBe(false)
  })

  it('allows safe class attributes', () => {
    expect(shouldStripAttr('class', 'gmail_quote')).toBe(false)
  })

  it('allows safe src attributes', () => {
    expect(shouldStripAttr('src', 'https://example.com/image.png')).toBe(false)
  })
})

// ─── Image blocking — srcset stripping logic ─────────────────────────────────

describe('Image blocking — srcset attribute', () => {
  /**
   * Mirrors the replaceImageSources and hasImages logic from MessageBody.tsx.
   * Uses string regex operations (no DOMParser required for Node environment).
   */
  function stripImageResources(html: string): string {
    return html.replace(/<img[^>]+>/gi, (match) => {
      return match
        .replace(/src=["'][^"']*["']/gi, '')
        .replace(/srcset=["'][^"']*["']/gi, '')
    })
  }

  function hasExternalImages(sanitizedHtml: string): boolean {
    return (
      /<img[^>]+src=["']/i.test(sanitizedHtml) ||
      /<img[^>]+srcset=["']/i.test(sanitizedHtml)
    )
  }

  it('strips srcset attribute when images are blocked', () => {
    const html = '<img srcset="https://example.com/img.png 2x" alt="test">'
    const result = stripImageResources(html)
    expect(result).not.toContain('srcset=')
    expect(result).toContain('alt="test"')
  })

  it('strips both src and srcset when images are blocked', () => {
    const html = '<img src="https://example.com/img.png" srcset="https://example.com/img@2x.png 2x" alt="hi">'
    const result = stripImageResources(html)
    expect(result).not.toContain('src=')
    expect(result).not.toContain('srcset=')
  })

  it('detects srcset-only images for Show images banner', () => {
    const html = '<p>Hello</p><img srcset="https://tracker.com/pixel.png 1x" alt="">'
    expect(hasExternalImages(html)).toBe(true)
  })

  it('detects src images for Show images banner', () => {
    const html = '<p>Hello</p><img src="https://example.com/img.png">'
    expect(hasExternalImages(html)).toBe(true)
  })

  it('returns false when no img with src or srcset', () => {
    const html = '<p>Hello</p><img alt="decorative">'
    expect(hasExternalImages(html)).toBe(false)
  })
})

// ─── Load-more deduplication logic ───────────────────────────────────────────

describe('Load-more message deduplication', () => {
  /**
   * Mirrors the LOAD_MORE_MESSAGES_SUCCESS reducer deduplication logic.
   */
  function mergeAndDedup(older: Message[], existing: Message[]): Message[] {
    const seenIds = new Set<string>()
    return [...older, ...existing]
      .filter((m) => {
        if (seenIds.has(m.id)) return false
        seenIds.add(m.id)
        return true
      })
      .sort((a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime())
  }

  it('removes duplicate messages by ID when pages overlap', () => {
    const existing: Message[] = [
      makeMessage({ id: 'msg-2', sentAt: '2024-03-01T10:00:00Z' }),
      makeMessage({ id: 'msg-3', sentAt: '2024-03-01T12:00:00Z' })
    ]
    const older: Message[] = [
      makeMessage({ id: 'msg-1', sentAt: '2024-03-01T08:00:00Z' }),
      makeMessage({ id: 'msg-2', sentAt: '2024-03-01T10:00:00Z' }) // duplicate
    ]
    const result = mergeAndDedup(older, existing)
    expect(result).toHaveLength(3)
    const ids = result.map((m) => m.id)
    expect(ids).toEqual(['msg-1', 'msg-2', 'msg-3'])
  })

  it('preserves all unique messages when there are no overlaps', () => {
    const existing: Message[] = [makeMessage({ id: 'msg-3', sentAt: '2024-03-01T12:00:00Z' })]
    const older: Message[] = [makeMessage({ id: 'msg-1', sentAt: '2024-03-01T08:00:00Z' })]
    const result = mergeAndDedup(older, existing)
    expect(result).toHaveLength(2)
  })

  it('deduplicates when same page token fires twice', () => {
    const existing: Message[] = [
      makeMessage({ id: 'msg-1', sentAt: '2024-03-01T08:00:00Z' }),
      makeMessage({ id: 'msg-2', sentAt: '2024-03-01T10:00:00Z' })
    ]
    // Both calls return same page
    const secondPage: Message[] = [
      makeMessage({ id: 'msg-1', sentAt: '2024-03-01T08:00:00Z' }),
      makeMessage({ id: 'msg-2', sentAt: '2024-03-01T10:00:00Z' })
    ]
    const result = mergeAndDedup(secondPage, existing)
    expect(result).toHaveLength(2)
  })
})
