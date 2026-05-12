import { describe, it, expect } from 'vitest'
import type { Account, Thread, ListThreadsResult } from '../types'

interface InboxState {
  accounts: Account[]
  selectedAccountId: string | null
  threads: Thread[]
  selectedThreadId: string | null
  loading: boolean
  loadingMore: boolean
  error: string | null
  nextCursor: string | undefined
  hasMore: boolean
}

type InboxAction =
  | { type: 'SET_ACCOUNTS'; payload: Account[] }
  | { type: 'SELECT_ACCOUNT'; payload: string }
  | { type: 'LOAD_THREADS_START' }
  | { type: 'LOAD_THREADS_SUCCESS'; payload: ListThreadsResult }
  | { type: 'LOAD_MORE_START' }
  | { type: 'LOAD_MORE_SUCCESS'; payload: ListThreadsResult }
  | { type: 'LOAD_FAILURE'; payload: string }
  | { type: 'SELECT_THREAD'; payload: string }
  | { type: 'MOVE_SELECTION'; payload: 'up' | 'down' }
  | { type: 'REFRESH' }

function inboxReducer(state: InboxState, action: InboxAction): InboxState {
  switch (action.type) {
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload }
    case 'SELECT_ACCOUNT':
      return {
        ...state,
        selectedAccountId: action.payload,
        threads: [],
        selectedThreadId: null,
        nextCursor: undefined,
        hasMore: false,
        error: null
      }
    case 'LOAD_THREADS_START':
      return { ...state, loading: true, error: null }
    case 'LOAD_THREADS_SUCCESS':
      return {
        ...state,
        loading: false,
        threads: action.payload.threads,
        nextCursor: action.payload.nextCursor,
        hasMore: action.payload.hasMore,
        selectedThreadId:
          action.payload.threads.length > 0
            ? action.payload.threads[0].id
            : null
      }
    case 'LOAD_MORE_START':
      return { ...state, loadingMore: true }
    case 'LOAD_MORE_SUCCESS':
      return {
        ...state,
        loadingMore: false,
        threads: [...state.threads, ...action.payload.threads],
        nextCursor: action.payload.nextCursor,
        hasMore: action.payload.hasMore
      }
    case 'LOAD_FAILURE':
      return {
        ...state,
        loading: false,
        loadingMore: false,
        error: action.payload
      }
    case 'SELECT_THREAD':
      return { ...state, selectedThreadId: action.payload }
    case 'MOVE_SELECTION': {
      const currentIndex = state.threads.findIndex(
        (t) => t.id === state.selectedThreadId
      )
      let newIndex: number
      if (action.payload === 'down') {
        newIndex = Math.min(currentIndex + 1, state.threads.length - 1)
      } else {
        newIndex = Math.max(currentIndex - 1, 0)
      }
      return {
        ...state,
        selectedThreadId: state.threads[newIndex]?.id ?? null
      }
    }
    case 'REFRESH':
      return {
        ...state,
        threads: [],
        selectedThreadId: null,
        nextCursor: undefined,
        hasMore: false,
        error: null
      }
    default:
      return state
  }
}

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

const initialState: InboxState = {
  accounts: [],
  selectedAccountId: null,
  threads: [],
  selectedThreadId: null,
  loading: false,
  loadingMore: false,
  error: null,
  nextCursor: undefined,
  hasMore: false
}

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
    const prev = {
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
    const prev = {
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
    const prev = {
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
    const prev = {
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
    const prev = {
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
    const prev = {
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
