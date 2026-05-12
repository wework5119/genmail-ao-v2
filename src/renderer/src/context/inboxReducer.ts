import type { Account, Thread, ListThreadsResult } from '../types'

export interface InboxState {
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

export type InboxAction =
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

export const initialState: InboxState = {
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

export function inboxReducer(state: InboxState, action: InboxAction): InboxState {
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
      return { ...state, loading: false, loadingMore: false, error: action.payload }
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
