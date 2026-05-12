import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ThreadRow from './ThreadRow'
import type { Thread } from '../types'

const baseThread: Thread = {
  id: 't1',
  subject: 'Test Subject',
  snippet: 'This is a test snippet for the thread',
  lastMessageAt: new Date().toISOString(),
  from: { name: 'Alice Johnson', email: 'alice@example.com' },
  to: [{ name: 'Bob', email: 'bob@example.com' }],
  unread: true,
  hasAttachments: false,
  labels: []
}

describe('ThreadRow', () => {
  it('renders sender name and subject', () => {
    render(
      <ThreadRow
        thread={baseThread}
        selected={false}
        onSelect={() => {}}
        onDoubleClick={() => {}}
      />
    )
    expect(screen.getByText('Alice Johnson')).toBeTruthy()
    expect(screen.getByText('Test Subject')).toBeTruthy()
    expect(screen.getByText('This is a test snippet for the thread')).toBeTruthy()
  })

  it('renders relative timestamp', () => {
    render(
      <ThreadRow
        thread={baseThread}
        selected={false}
        onSelect={() => {}}
        onDoubleClick={() => {}}
      />
    )
    expect(screen.getByText(/now|m ago|h ago|d ago|Mon|Tue|Wed|Thu|Fri|Sat|Sun/)).toBeTruthy()
  })

  it('applies selected styles when selected', () => {
    const { container } = render(
      <ThreadRow
        thread={baseThread}
        selected={true}
        onSelect={() => {}}
        onDoubleClick={() => {}}
      />
    )
    const button = container.querySelector('button')
    expect(button?.className).toContain('bg-accent-50')
  })

  it('shows unread dot for unread threads', () => {
    const { container } = render(
      <ThreadRow
        thread={baseThread}
        selected={false}
        onSelect={() => {}}
        onDoubleClick={() => {}}
      />
    )
    const dot = container.querySelector('.rounded-full.bg-accent-600')
    expect(dot).toBeTruthy()
  })

  it('hides unread dot for read threads', () => {
    const { container } = render(
      <ThreadRow
        thread={{ ...baseThread, unread: false }}
        selected={false}
        onSelect={() => {}}
        onDoubleClick={() => {}}
      />
    )
    const dot = container.querySelector('.rounded-full.bg-accent-600')
    expect(dot).toBeFalsy()
  })
})
