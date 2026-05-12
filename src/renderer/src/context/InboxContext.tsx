import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react'
import type { Account, Thread, ListThreadsResult } from '../types'
import { getAccounts, listThreads } from '../lib/ipc'

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

interface InboxContextValue {
  state: InboxState
  selectAccount: (id: string) => void
  selectThread: (id: string) => void
  moveSelection: (dir: 'up' | 'down') => void
  loadMore: () => void
  refresh: () => void
  retry: () => void
}

const InboxContext = createContext<InboxContextValue | null>(null)

export function InboxProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(inboxReducer, initialState)
  const loadAfterInit = useRef(false)

  const fetchThreads = useCallback(
    async (accountId: string, cursor?: string) => {
      if (!cursor) {
        dispatch({ type: 'LOAD_THREADS_START' })
      } else {
        dispatch({ type: 'LOAD_MORE_START' })
      }

      try {
        const result = await listThreads({
          accountId,
          cursor,
          pageSize: 25
        })
        if (cursor) {
          dispatch({ type: 'LOAD_MORE_SUCCESS', payload: result })
        } else {
          dispatch({ type: 'LOAD_THREADS_SUCCESS', payload: result })
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load threads'
        dispatch({ type: 'LOAD_FAILURE', payload: message })
      }
    },
    []
  )

  useEffect(() => {
    getAccounts()
      .then((accounts) => {
        dispatch({ type: 'SET_ACCOUNTS', payload: accounts })
        if (accounts.length > 0) {
          dispatch({ type: 'SELECT_ACCOUNT', payload: accounts[0].id })
          loadAfterInit.current = true
        }
      })
      .catch(() => {
        dispatch({
          type: 'SET_ACCOUNTS',
          payload: [
            {
              id: '1',
              email: 'alice@example.com',
              name: 'Alice Johnson',
              provider: 'gmail'
            }
          ]
        })
        dispatch({ type: 'SELECT_ACCOUNT', payload: '1' })
        loadAfterInit.current = true
      })
  }, [])

  useEffect(() => {
    if (state.selectedAccountId && loadAfterInit.current) {
      loadAfterInit.current = false
      fetchThreads(state.selectedAccountId)
    }
  }, [state.selectedAccountId, fetchThreads])

  const selectAccount = useCallback((id: string) => {
    dispatch({ type: 'SELECT_ACCOUNT', payload: id })
    loadAfterInit.current = true
  }, [])

  const selectThread = useCallback((id: string) => {
    dispatch({ type: 'SELECT_THREAD', payload: id })
  }, [])

  const moveSelection = useCallback((dir: 'up' | 'down') => {
    dispatch({ type: 'MOVE_SELECTION', payload: dir })
  }, [])

  const loadMore = useCallback(() => {
    if (
      state.selectedAccountId &&
      state.nextCursor &&
      !state.loadingMore
    ) {
      fetchThreads(state.selectedAccountId, state.nextCursor)
    }
  }, [state.selectedAccountId, state.nextCursor, state.loadingMore, fetchThreads])

  const refresh = useCallback(() => {
    if (state.selectedAccountId) {
      dispatch({ type: 'REFRESH' })
      loadAfterInit.current = true
    }
  }, [state.selectedAccountId])

  const retry = useCallback(() => {
    if (state.selectedAccountId) {
      fetchThreads(state.selectedAccountId)
    }
  }, [state.selectedAccountId, fetchThreads])

  return (
    <InboxContext.Provider
      value={{
        state,
        selectAccount,
        selectThread,
        moveSelection,
        loadMore,
        refresh,
        retry
      }}
    >
      {children}
    </InboxContext.Provider>
  )
}

export function useInbox(): InboxContextValue {
  const ctx = useContext(InboxContext)
  if (!ctx) {
    throw new Error('useInbox must be used within InboxProvider')
  }
  return ctx
}
