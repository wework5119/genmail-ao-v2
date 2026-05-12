import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef
} from 'react'
import type {
  Account,
  Thread,
  Message,
  View,
  GetMessagesResult
} from '../types'
import { getAccounts, listThreads, getMessages } from '../lib/ipc'

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
  scrollPosition: number

  view: View
  messages: Message[]
  messagesLoading: boolean
  messagesLoadingMore: boolean
  messagesError: string | null
  messagesNextToken: string | undefined
  messagesHasMore: boolean
}

type InboxAction =
  | { type: 'SET_ACCOUNTS'; payload: Account[] }
  | { type: 'SELECT_ACCOUNT'; payload: string }
  | { type: 'LOAD_THREADS_START' }
  | { type: 'LOAD_THREADS_SUCCESS'; payload: { threads: Thread[]; nextCursor?: string; hasMore: boolean } }
  | { type: 'LOAD_MORE_START' }
  | { type: 'LOAD_MORE_SUCCESS'; payload: { threads: Thread[]; nextCursor?: string; hasMore: boolean } }
  | { type: 'LOAD_FAILURE'; payload: string }
  | { type: 'SELECT_THREAD'; payload: string }
  | { type: 'MOVE_SELECTION'; payload: 'up' | 'down' }
  | { type: 'REFRESH' }
  | { type: 'SET_SCROLL_POSITION'; payload: number }
  | { type: 'NAVIGATE'; payload: View }
  | { type: 'LOAD_MESSAGES_START' }
  | { type: 'LOAD_MESSAGES_SUCCESS'; payload: GetMessagesResult }
  | { type: 'LOAD_MORE_MESSAGES_START' }
  | { type: 'LOAD_MORE_MESSAGES_SUCCESS'; payload: GetMessagesResult }
  | { type: 'LOAD_MESSAGES_FAILURE'; payload: string }
  | { type: 'CLEAR_MESSAGES' }

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
        error: null,
        view: 'inbox',
        messages: [],
        messagesLoading: false,
        messagesError: null
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
    case 'SET_SCROLL_POSITION':
      return { ...state, scrollPosition: action.payload }
    case 'NAVIGATE':
      return { ...state, view: action.payload }
    case 'LOAD_MESSAGES_START':
      return { ...state, messagesLoading: true, messagesError: null }
    case 'LOAD_MESSAGES_SUCCESS': {
      const sorted = [...action.payload.messages].sort(
        (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      )
      return {
        ...state,
        messagesLoading: false,
        messages: sorted,
        messagesNextToken: action.payload.nextPageToken,
        messagesHasMore: action.payload.hasMore
      }
    }
    case 'LOAD_MORE_MESSAGES_START':
      return { ...state, messagesLoadingMore: true }
    case 'LOAD_MORE_MESSAGES_SUCCESS': {
      // Older messages are prepended; re-sort to maintain chronological order
      const combined = [...action.payload.messages, ...state.messages].sort(
        (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      )
      return {
        ...state,
        messagesLoadingMore: false,
        messages: combined,
        messagesNextToken: action.payload.nextPageToken,
        messagesHasMore: action.payload.hasMore
      }
    }
    case 'LOAD_MESSAGES_FAILURE':
      return {
        ...state,
        messagesLoading: false,
        messagesLoadingMore: false,
        messagesError: action.payload
      }
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
        messagesNextToken: undefined,
        messagesHasMore: false,
        messagesError: null
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
  hasMore: false,
  scrollPosition: 0,
  view: 'inbox',
  messages: [],
  messagesLoading: false,
  messagesLoadingMore: false,
  messagesError: null,
  messagesNextToken: undefined,
  messagesHasMore: false
}

interface InboxContextValue {
  state: InboxState
  selectAccount: (id: string) => void
  selectThread: (id: string) => void
  moveSelection: (dir: 'up' | 'down') => void
  loadMore: () => void
  refresh: () => void
  retry: () => void
  setScrollPosition: (pos: number) => void
  navigateToThread: (threadId: string) => void
  navigateToInbox: () => void
  loadMessages: () => Promise<void>
  loadMoreMessages: () => Promise<void>
  retryMessages: () => Promise<void>
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
              displayName: 'Alice Johnson',
              name: 'Alice Johnson',
              provider: 'gmail',
              isAuthenticated: true
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

  const setScrollPosition = useCallback((pos: number) => {
    dispatch({ type: 'SET_SCROLL_POSITION', payload: pos })
  }, [])

  const navigateToThread = useCallback(
    (threadId: string) => {
      dispatch({ type: 'CLEAR_MESSAGES' })
      dispatch({ type: 'SELECT_THREAD', payload: threadId })
      dispatch({ type: 'NAVIGATE', payload: 'thread' })
      // Reflect thread selection in URL hash for AC1
      window.location.hash = `thread/${encodeURIComponent(threadId)}`
    },
    []
  )

  const navigateToInbox = useCallback(() => {
    dispatch({ type: 'NAVIGATE', payload: 'inbox' })
    window.location.hash = ''
  }, [])

  const loadMessages = useCallback(async () => {
    if (!state.selectedAccountId || !state.selectedThreadId) return
    dispatch({ type: 'LOAD_MESSAGES_START' })
    try {
      const result = await getMessages({
        accountId: state.selectedAccountId,
        threadId: state.selectedThreadId,
        pageParams: { pageSize: 20 }
      })
      dispatch({ type: 'LOAD_MESSAGES_SUCCESS', payload: result })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load messages'
      dispatch({ type: 'LOAD_MESSAGES_FAILURE', payload: message })
    }
  }, [state.selectedAccountId, state.selectedThreadId])

  const loadMoreMessages = useCallback(async () => {
    if (
      !state.selectedAccountId ||
      !state.selectedThreadId ||
      !state.messagesNextToken ||
      state.messagesLoadingMore
    )
      return
    dispatch({ type: 'LOAD_MORE_MESSAGES_START' })
    try {
      const result = await getMessages({
        accountId: state.selectedAccountId,
        threadId: state.selectedThreadId,
        pageParams: {
          pageSize: 20,
          pageToken: state.messagesNextToken
        }
      })
      dispatch({ type: 'LOAD_MORE_MESSAGES_SUCCESS', payload: result })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load more messages'
      dispatch({ type: 'LOAD_MESSAGES_FAILURE', payload: message })
    }
  }, [
    state.selectedAccountId,
    state.selectedThreadId,
    state.messagesNextToken,
    state.messagesLoadingMore
  ])

  const retryMessages = useCallback(async () => {
    await loadMessages()
  }, [loadMessages])

  return (
    <InboxContext.Provider
      value={{
        state,
        selectAccount,
        selectThread,
        moveSelection,
        loadMore,
        refresh,
        retry,
        setScrollPosition,
        navigateToThread,
        navigateToInbox,
        loadMessages,
        loadMoreMessages,
        retryMessages
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
