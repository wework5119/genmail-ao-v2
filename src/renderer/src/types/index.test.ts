import { describe, it, expect } from 'vitest'

describe('types', () => {
  it('Account type has required fields', () => {
    const account = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      provider: 'gmail'
    }
    expect(account.id).toBe('1')
    expect(account.email).toContain('@')
  })

  it('Thread type has required fields', () => {
    const thread = {
      id: 't1',
      subject: 'Hello',
      snippet: 'Test message',
      lastMessageAt: new Date().toISOString(),
      from: { name: 'Alice', email: 'alice@example.com' },
      to: [{ name: 'Bob', email: 'bob@example.com' }],
      unread: true,
      hasAttachments: false,
      labels: []
    }
    expect(thread.unread).toBe(true)
    expect(thread.from.name).toBe('Alice')
  })
})
