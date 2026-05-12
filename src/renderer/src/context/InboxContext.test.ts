import { describe, it, expect } from 'vitest'
import { inboxReducer, initialState } from './inboxReducer'
import type { InboxState } from './inboxReducer'
import type { Account, Thread, ListThreadsResult } from '../types'

const mockAccount: Account = {
  id: '1',
  email: 'test@example.com',
  name: 'Test',
  provider: 'gmail'
}

const mockThread = (id: string, overrides?: Partial<Thread>): Thread => ({
  id,
  subject: 'Test Subject',
  snippet: 'Test snippet',
  lastMessageAt: new Date().toISOString(),
  from: { name: 'Alice', email: 'alice@example.com' },
  to: [{ name: 'Test', email: 'test@example.com' }],
  unread: true,
  hasAttachments: false,
  labels: [],
  ...overrides
})

describe('inboxReducer', () => {
  it('handles SET_ACCOUNTS', () => {
    const state = inboxReducer(initialState, {
      type: 'SET_ACCOUNTS',
      payload: [mockAccount]
    })
    expect(state.accounts).toHaveLength(1)
    expect(state.accounts[0].email).toBe('test@example.com')
  })

  it('handles SELECT_ACCOUNT and clears threads', () => {
    const prev: InboxState = {
      ...initialState,
      threads: [mockThread('t1')],
      selectedThreadId: 't1',
      selectedAccountId: '1'
    }
    const state = inboxReducer(prev, {
      type: 'SELECT_ACCOUNT',
      payload: '2'
    })
    expect(state.selectedAccountId).toBe('2')
    expect(state.threads).toHaveLength(0)
    expect(state.selectedThreadId).toBeNull()
  })

  it('handles LOAD_THREADS_START', () => {
    const state = inboxReducer(initialState, { type: 'LOAD_THREADS_START' })
    expect(state.loading).toBe(true)
    expect(state.error).toBeNull()
  })

  it('handles LOAD_THREADS_SUCCESS', () => {
    const result: ListThreadsResult = {
      threads: [mockThread('t1'), mockThread('t2')],
      nextCursor: 'cursor2',
      hasMore: true
    }
    const state = inboxReducer(initialState, {
      type: 'LOAD_THREADS_SUCCESS',
      payload: result
    })
    expect(state.loading).toBe(false)
    expect(state.threads).toHaveLength(2)
    expect(state.nextCursor).toBe('cursor2')
    expect(state.hasMore).toBe(true)
    expect(state.selectedThreadId).toBe('t1')
  })

  it('handles LOAD_MORE_SUCCESS and appends threads', () => {
    const prev: InboxState = {
      ...initialState,
      threads: [mockThread('t1')]
    }
    const result: ListThreadsResult = {
      threads: [mockThread('t2')],
      hasMore: false
    }
    const state = inboxReducer(prev, {
      type: 'LOAD_MORE_SUCCESS',
      payload: result
    })
    expect(state.threads).toHaveLength(2)
    expect(state.loadingMore).toBe(false)
  })

  it('handles LOAD_FAILURE', () => {
    const state = inboxReducer(
      { ...initialState, loading: true },
      { type: 'LOAD_FAILURE', payload: 'Network error' }
    )
    expect(state.loading).toBe(false)
    expect(state.error).toBe('Network error')
  })

  it('handles SELECT_THREAD', () => {
    const state = inboxReducer(initialState, {
      type: 'SELECT_THREAD',
      payload: 't1'
    })
    expect(state.selectedThreadId).toBe('t1')
  })

  it('handles MOVE_SELECTION down', () => {
    const prev: InboxState = {
      ...initialState,
      threads: [mockThread('t1'), mockThread('t2'), mockThread('t3')],
      selectedThreadId: 't1'
    }
    const state = inboxReducer(prev, {
      type: 'MOVE_SELECTION',
      payload: 'down'
    })
    expect(state.selectedThreadId).toBe('t2')
  })

  it('handles MOVE_SELECTION up', () => {
    const prev: InboxState = {
      ...initialState,
      threads: [mockThread('t1'), mockThread('t2'), mockThread('t3')],
      selectedThreadId: 't2'
    }
    const state = inboxReducer(prev, {
      type: 'MOVE_SELECTION',
      payload: 'up'
    })
    expect(state.selectedThreadId).toBe('t1')
  })

  it('does not move selection below first item', () => {
    const prev: InboxState = {
      ...initialState,
      threads: [mockThread('t1'), mockThread('t2')],
      selectedThreadId: 't1'
    }
    const state = inboxReducer(prev, {
      type: 'MOVE_SELECTION',
      payload: 'up'
    })
    expect(state.selectedThreadId).toBe('t1')
  })

  it('handles REFRESH', () => {
    const prev: InboxState = {
      ...initialState,
      threads: [mockThread('t1')],
      selectedThreadId: 't1',
      nextCursor: 'cursor',
      hasMore: true
    }
    const state = inboxReducer(prev, { type: 'REFRESH' })
    expect(state.threads).toHaveLength(0)
    expect(state.selectedThreadId).toBeNull()
    expect(state.nextCursor).toBeUndefined()
    expect(state.hasMore).toBe(false)
  })
})
