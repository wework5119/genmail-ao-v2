import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react'
import { getAccounts, listThreads } from '../lib/ipc'
import { inboxReducer, initialState } from './inboxReducer'
import type { InboxState } from './inboxReducer'

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
      const accountId = state.selectedAccountId
      dispatch({ type: 'REFRESH' })
      // Call fetchThreads directly — do NOT rely on the selectedAccountId effect
      // because selectedAccountId doesn't change during refresh, so the effect
      // would never re-run and threads would remain permanently cleared.
      fetchThreads(accountId)
    }
  }, [state.selectedAccountId, fetchThreads])

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
