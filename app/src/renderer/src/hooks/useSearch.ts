import { useReducer, useEffect, useRef } from 'react'
import type { SearchResult } from '../types'
import { searchThreads } from '../lib/ipc'
import { useDebounce } from './useDebounce'

export interface SearchState {
  query: string
  debouncedQuery: string
  results: SearchResult[]
  loading: boolean
  showSpinner: boolean
  error: string | null
  selectedIndex: number
}

export type SearchAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_DEBOUNCED_QUERY'; payload: string }
  | { type: 'SEARCH_START' }
  | { type: 'SEARCH_SUCCESS'; payload: { results: SearchResult[]; query: string } }
  | { type: 'SEARCH_FAILURE'; payload: string }
  | { type: 'SHOW_SPINNER' }
  | { type: 'MOVE_SELECTION'; payload: 'up' | 'down' }
  | { type: 'RESET_SELECTION' }
  | { type: 'CLEAR' }

export function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_QUERY':
      return {
        ...state,
        query: action.payload,
        selectedIndex: 0
      }
    case 'SET_DEBOUNCED_QUERY':
      return { ...state, debouncedQuery: action.payload }
    case 'SEARCH_START':
      return { ...state, loading: true, error: null }
    case 'SEARCH_SUCCESS':
      return {
        ...state,
        loading: false,
        showSpinner: false,
        results: action.payload.results.slice(0, 20),
        error: null,
        selectedIndex: 0
      }
    case 'SEARCH_FAILURE':
      return {
        ...state,
        loading: false,
        showSpinner: false,
        error: action.payload
      }
    case 'SHOW_SPINNER':
      return { ...state, showSpinner: true }
    case 'MOVE_SELECTION': {
      const maxIndex = state.results.length - 1
      if (maxIndex < 0) return state
      let newIndex: number
      if (action.payload === 'down') {
        newIndex = Math.min(state.selectedIndex + 1, maxIndex)
      } else {
        newIndex = Math.max(state.selectedIndex - 1, 0)
      }
      return { ...state, selectedIndex: newIndex }
    }
    case 'RESET_SELECTION':
      return { ...state, selectedIndex: 0 }
    case 'CLEAR':
      return {
        ...initialSearchState,
        query: '',
        debouncedQuery: ''
      }
    default:
      return state
  }
}

export const initialSearchState: SearchState = {
  query: '',
  debouncedQuery: '',
  results: [],
  loading: false,
  showSpinner: false,
  error: null,
  selectedIndex: 0
}

interface UseSearchOptions {
  accountId: string | null
  debounceMs?: number
  spinnerDelayMs?: number
}

interface UseSearchReturn {
  state: SearchState
  setQuery: (q: string) => void
  moveSelection: (dir: 'up' | 'down') => void
  clear: () => void
}

export function useSearch({
  accountId,
  debounceMs = 200,
  spinnerDelayMs = 500
}: UseSearchOptions): UseSearchReturn {
  const [state, dispatch] = useReducer(searchReducer, initialSearchState)
  const debouncedQuery = useDebounce(state.query, debounceMs)
  const spinnerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef<number>(0)

  // Sync debounced query into reducer state
  useEffect(() => {
    dispatch({ type: 'SET_DEBOUNCED_QUERY', payload: debouncedQuery })
  }, [debouncedQuery])

  // Perform search when debouncedQuery changes
  useEffect(() => {
    if (!debouncedQuery.trim() || !accountId) {
      // Clear results when query is empty
      if (state.results.length > 0 || state.loading) {
        dispatch({ type: 'CLEAR' })
      }
      if (spinnerTimerRef.current) {
        clearTimeout(spinnerTimerRef.current)
        spinnerTimerRef.current = null
      }
      return
    }

    const requestId = ++requestIdRef.current
    dispatch({ type: 'SEARCH_START' })

    // Set spinner timer — shows after spinnerDelayMs if not yet resolved
    if (spinnerTimerRef.current) {
      clearTimeout(spinnerTimerRef.current)
    }
    spinnerTimerRef.current = setTimeout(() => {
      // Only show spinner if this request is still pending
      if (requestIdRef.current === requestId) {
        dispatch({ type: 'SHOW_SPINNER' })
      }
    }, spinnerDelayMs)

    searchThreads({ accountId, query: debouncedQuery })
      .then((data) => {
        if (requestIdRef.current !== requestId) return // stale
        clearTimeout(spinnerTimerRef.current!)
        spinnerTimerRef.current = null
        dispatch({ type: 'SEARCH_SUCCESS', payload: data })
      })
      .catch((err: unknown) => {
        if (requestIdRef.current !== requestId) return // stale
        clearTimeout(spinnerTimerRef.current!)
        spinnerTimerRef.current = null
        // Sanitize raw IPC/network errors — never expose internals to the UI
        const rawMessage = err instanceof Error ? err.message : ''
        const isNotFound = rawMessage.includes('404')
        const isNetwork = rawMessage.toLowerCase().includes('network') || rawMessage.toLowerCase().includes('fetch')
        const userMessage = isNotFound
          ? 'No results found for this query.'
          : isNetwork
            ? 'Network error. Check your connection and try again.'
            : 'Search is temporarily unavailable. Please try again.'
        dispatch({ type: 'SEARCH_FAILURE', payload: userMessage })
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, accountId])

  // Cleanup spinner timer on unmount
  useEffect(() => {
    return () => {
      if (spinnerTimerRef.current) {
        clearTimeout(spinnerTimerRef.current)
      }
    }
  }, [])

  const setQuery = (q: string) => {
    dispatch({ type: 'SET_QUERY', payload: q })
  }

  const moveSelection = (dir: 'up' | 'down') => {
    dispatch({ type: 'MOVE_SELECTION', payload: dir })
  }

  const clear = () => {
    requestIdRef.current++ // invalidate any in-flight request
    if (spinnerTimerRef.current) {
      clearTimeout(spinnerTimerRef.current)
      spinnerTimerRef.current = null
    }
    dispatch({ type: 'CLEAR' })
  }

  return { state, setQuery, moveSelection, clear }
}
