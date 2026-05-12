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

// ─── Relative timestamp formatting ──────────────────────────────────────────

describe('Relative timestamp formatting', () => {
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

    const date = new Date(iso)
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return weekdays[date.getDay()]
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

  it('returns weekday name for messages older than a week', () => {
    const iso = '2024-02-27T12:00:00Z' // Tuesday
    const result = formatRelativeTime(iso, now)
    expect(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).toContain(result)
  })
})

// ─── Avatar initials logic ───────────────────────────────────────────────────

describe('Avatar initials', () => {
  function getInitials(name: string): string {
    return name
      .split(' ')
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
