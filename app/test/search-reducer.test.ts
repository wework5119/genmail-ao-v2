/**
 * Unit tests for the search reducer (searchReducer) and related state
 * transformations used by the SearchOverlay feature (AC10).
 *
 * These tests exercise the pure reducer function and do NOT require a DOM.
 * They run under Vitest with environment: 'node'.
 */
import { describe, it, expect } from 'vitest'
import {
  searchReducer,
  initialSearchState,
  type SearchState,
  type SearchAction,
  type SearchResult
} from '../src/renderer/src/hooks/useSearch'

// ─── Helper factories ────────────────────────────────────────────────────────

function makeResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    threadId: 'thread-1',
    subject: 'Meeting tomorrow',
    snippet: 'See you at 10am!',
    sender: { name: 'Alice Johnson', email: 'alice@example.com' },
    date: '2024-03-01T10:00:00Z',
    unread: false,
    ...overrides
  }
}

// ─── Initial state ───────────────────────────────────────────────────────────

describe('searchReducer — initial state', () => {
  it('has empty query and results', () => {
    expect(initialSearchState.query).toBe('')
    expect(initialSearchState.results).toEqual([])
    expect(initialSearchState.loading).toBe(false)
    expect(initialSearchState.showSpinner).toBe(false)
    expect(initialSearchState.error).toBeNull()
    expect(initialSearchState.selectedIndex).toBe(0)
  })
})

// ─── SET_QUERY ───────────────────────────────────────────────────────────────

describe('searchReducer — SET_QUERY', () => {
  it('updates query and resets selectedIndex to 0', () => {
    const state: SearchState = {
      ...initialSearchState,
      selectedIndex: 3,
      results: [makeResult(), makeResult({ threadId: 'thread-2' }), makeResult({ threadId: 'thread-3' })]
    }
    const next = searchReducer(state, { type: 'SET_QUERY', payload: 'hello' })
    expect(next.query).toBe('hello')
    expect(next.selectedIndex).toBe(0)
  })

  it('does not clear results when query changes (results cleared by CLEAR or SEARCH_SUCCESS)', () => {
    const state: SearchState = {
      ...initialSearchState,
      results: [makeResult()],
      query: 'old'
    }
    const next = searchReducer(state, { type: 'SET_QUERY', payload: 'new' })
    expect(next.results).toHaveLength(1)
    expect(next.query).toBe('new')
  })
})

// ─── SEARCH_START ────────────────────────────────────────────────────────────

describe('searchReducer — SEARCH_START', () => {
  it('sets loading to true and clears error', () => {
    const state: SearchState = { ...initialSearchState, error: 'previous error', loading: false }
    const next = searchReducer(state, { type: 'SEARCH_START' })
    expect(next.loading).toBe(true)
    expect(next.error).toBeNull()
  })

  it('does not clear existing results when search starts', () => {
    const state: SearchState = { ...initialSearchState, results: [makeResult()] }
    const next = searchReducer(state, { type: 'SEARCH_START' })
    expect(next.results).toHaveLength(1)
  })
})

// ─── SEARCH_SUCCESS ──────────────────────────────────────────────────────────

describe('searchReducer — SEARCH_SUCCESS', () => {
  it('sets results and clears loading/spinner/error', () => {
    const results = [makeResult(), makeResult({ threadId: 'thread-2' })]
    const state: SearchState = {
      ...initialSearchState,
      loading: true,
      showSpinner: true,
      error: 'some error'
    }
    const next = searchReducer(state, {
      type: 'SEARCH_SUCCESS',
      payload: { results, query: 'meeting' }
    })
    expect(next.results).toHaveLength(2)
    expect(next.loading).toBe(false)
    expect(next.showSpinner).toBe(false)
    expect(next.error).toBeNull()
    expect(next.selectedIndex).toBe(0)
  })

  it('caps results at 20 items', () => {
    const results = Array.from({ length: 25 }, (_, i) =>
      makeResult({ threadId: `thread-${i}` })
    )
    const next = searchReducer(initialSearchState, {
      type: 'SEARCH_SUCCESS',
      payload: { results, query: 'test' }
    })
    expect(next.results).toHaveLength(20)
  })

  it('returns empty results for no-results response', () => {
    const next = searchReducer(
      { ...initialSearchState, loading: true },
      { type: 'SEARCH_SUCCESS', payload: { results: [], query: 'xyz' } }
    )
    expect(next.results).toEqual([])
    expect(next.loading).toBe(false)
  })
})

// ─── SEARCH_FAILURE ──────────────────────────────────────────────────────────

describe('searchReducer — SEARCH_FAILURE', () => {
  it('sets error and clears loading/spinner', () => {
    const state: SearchState = {
      ...initialSearchState,
      loading: true,
      showSpinner: true
    }
    const next = searchReducer(state, {
      type: 'SEARCH_FAILURE',
      payload: 'Network error'
    })
    expect(next.error).toBe('Network error')
    expect(next.loading).toBe(false)
    expect(next.showSpinner).toBe(false)
  })
})

// ─── SHOW_SPINNER ────────────────────────────────────────────────────────────

describe('searchReducer — SHOW_SPINNER', () => {
  it('sets showSpinner to true', () => {
    const next = searchReducer(initialSearchState, { type: 'SHOW_SPINNER' })
    expect(next.showSpinner).toBe(true)
  })

  it('does not affect loading or error', () => {
    const state: SearchState = { ...initialSearchState, loading: true, error: null }
    const next = searchReducer(state, { type: 'SHOW_SPINNER' })
    expect(next.loading).toBe(true)
    expect(next.error).toBeNull()
  })
})

// ─── MOVE_SELECTION ──────────────────────────────────────────────────────────

describe('searchReducer — MOVE_SELECTION', () => {
  function stateWithResults(count: number, selectedIndex = 0): SearchState {
    return {
      ...initialSearchState,
      results: Array.from({ length: count }, (_, i) =>
        makeResult({ threadId: `thread-${i}` })
      ),
      selectedIndex
    }
  }

  it('moves selection down', () => {
    const state = stateWithResults(5, 0)
    const next = searchReducer(state, { type: 'MOVE_SELECTION', payload: 'down' })
    expect(next.selectedIndex).toBe(1)
  })

  it('moves selection up', () => {
    const state = stateWithResults(5, 3)
    const next = searchReducer(state, { type: 'MOVE_SELECTION', payload: 'up' })
    expect(next.selectedIndex).toBe(2)
  })

  it('clamps selection at bottom (cannot go past last item)', () => {
    const state = stateWithResults(3, 2) // last index is 2
    const next = searchReducer(state, { type: 'MOVE_SELECTION', payload: 'down' })
    expect(next.selectedIndex).toBe(2)
  })

  it('clamps selection at top (cannot go below 0)', () => {
    const state = stateWithResults(3, 0)
    const next = searchReducer(state, { type: 'MOVE_SELECTION', payload: 'up' })
    expect(next.selectedIndex).toBe(0)
  })

  it('does nothing when results list is empty', () => {
    const state: SearchState = { ...initialSearchState, results: [], selectedIndex: 0 }
    const down = searchReducer(state, { type: 'MOVE_SELECTION', payload: 'down' })
    const up = searchReducer(state, { type: 'MOVE_SELECTION', payload: 'up' })
    expect(down.selectedIndex).toBe(0)
    expect(up.selectedIndex).toBe(0)
  })

  it('can navigate the full list from top to bottom', () => {
    let state = stateWithResults(5, 0)
    for (let i = 0; i < 4; i++) {
      state = searchReducer(state, { type: 'MOVE_SELECTION', payload: 'down' })
    }
    expect(state.selectedIndex).toBe(4)
    // One more should not go past end
    state = searchReducer(state, { type: 'MOVE_SELECTION', payload: 'down' })
    expect(state.selectedIndex).toBe(4)
  })
})

// ─── RESET_SELECTION ─────────────────────────────────────────────────────────

describe('searchReducer — RESET_SELECTION', () => {
  it('resets selectedIndex to 0', () => {
    const state: SearchState = { ...initialSearchState, selectedIndex: 5 }
    const next = searchReducer(state, { type: 'RESET_SELECTION' })
    expect(next.selectedIndex).toBe(0)
  })
})

// ─── CLEAR ───────────────────────────────────────────────────────────────────

describe('searchReducer — CLEAR', () => {
  it('resets the full search state', () => {
    const dirty: SearchState = {
      query: 'hello',
      debouncedQuery: 'hello',
      results: [makeResult()],
      loading: true,
      showSpinner: true,
      error: 'some error',
      selectedIndex: 3
    }
    const next = searchReducer(dirty, { type: 'CLEAR' })
    expect(next.query).toBe('')
    expect(next.debouncedQuery).toBe('')
    expect(next.results).toEqual([])
    expect(next.loading).toBe(false)
    expect(next.showSpinner).toBe(false)
    expect(next.error).toBeNull()
    expect(next.selectedIndex).toBe(0)
  })
})

// ─── Unknown actions (default branch) ────────────────────────────────────────

describe('searchReducer — unknown action', () => {
  it('returns state unchanged for unknown action type', () => {
    const state = { ...initialSearchState, query: 'test' }
    // Cast to force the default branch
    const next = searchReducer(state, { type: 'UNKNOWN_ACTION' } as unknown as SearchAction)
    expect(next).toBe(state)
  })
})

// ─── Debounce logic (pure timer-based tests) ─────────────────────────────────

describe('debounce logic (without React hooks)', () => {
  it('only fires callback after the delay has elapsed', () =>
    new Promise<void>((resolve) => {
      let fired = false
      const delay = 50 // ms

      let timer: ReturnType<typeof setTimeout> | null = null

      function setDebounced(val: string): void {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
          fired = true
          expect(val).toBe('final')
          resolve()
        }, delay)
      }

      // Rapid changes — only 'final' should be captured
      setDebounced('a')
      setDebounced('ab')
      setDebounced('abc')
      setDebounced('final')

      // Should NOT have fired yet
      expect(fired).toBe(false)
    }))

  it('timer is cancelled when a new value arrives before delay', () =>
    new Promise<void>((resolve) => {
      let callCount = 0
      const delay = 30

      let timer: ReturnType<typeof setTimeout> | null = null

      function setDebounced(): void {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
          callCount++
        }, delay)
      }

      setDebounced()
      setDebounced() // cancels previous
      setDebounced() // cancels previous

      // After one delay, only 1 call should have been made
      setTimeout(() => {
        expect(callCount).toBe(1)
        resolve()
      }, delay + 20)
    }))
})

// ─── Stale search response guard ─────────────────────────────────────────────

describe('stale search response guard', () => {
  /**
   * Mirrors the pattern used in useSearch to discard stale in-flight responses
   * using a monotonic requestId counter.
   */
  it('discards results from a previous request when a newer one is pending', () => {
    let requestId = 0
    const results: string[] = []

    function makeRequest(value: string, delay: number): Promise<string> {
      const myRequestId = ++requestId
      return new Promise((resolve) => {
        setTimeout(() => {
          // Only process if still the latest request
          if (requestId === myRequestId) {
            results.push(value)
          }
          resolve(value)
        }, delay)
      })
    }

    // Start two requests — second one "wins"
    const p1 = makeRequest('stale', 100)
    const p2 = makeRequest('fresh', 50)

    return Promise.all([p1, p2]).then(() => {
      // Only the fresh (faster) request should have been recorded since it ran second
      // Actually: stale was started first with requestId=1, then fresh overwrites to requestId=2
      // stale completes after 100ms: requestId is 2, 1 !== 2 → discarded
      // fresh completes after 50ms: requestId is 2, 2 === 2 → recorded
      expect(results).toEqual(['fresh'])
    })
  })
})

// ─── SearchResult type ───────────────────────────────────────────────────────

describe('SearchResult type shape', () => {
  it('has required fields', () => {
    const result = makeResult()
    expect(result.threadId).toBe('thread-1')
    expect(result.subject).toBe('Meeting tomorrow')
    expect(result.sender.name).toBe('Alice Johnson')
    expect(result.sender.email).toBe('alice@example.com')
    expect(result.date).toBe('2024-03-01T10:00:00Z')
    expect(result.unread).toBe(false)
    expect(result.snippet).toBeTruthy()
  })

  it('supports unread flag', () => {
    const unread = makeResult({ unread: true })
    const read = makeResult({ unread: false })
    expect(unread.unread).toBe(true)
    expect(read.unread).toBe(false)
  })
})

// ─── Navigation: index-to-result mapping ─────────────────────────────────────

describe('Search navigation — selectedIndex to result', () => {
  it('selectedIndex correctly indexes into results array', () => {
    const results = [
      makeResult({ threadId: 'thread-a' }),
      makeResult({ threadId: 'thread-b' }),
      makeResult({ threadId: 'thread-c' })
    ]
    const state: SearchState = { ...initialSearchState, results, selectedIndex: 1 }
    const selected = state.results[state.selectedIndex]
    expect(selected.threadId).toBe('thread-b')
  })

  it('after moving down twice, selects the third result', () => {
    const results = [
      makeResult({ threadId: 'thread-a' }),
      makeResult({ threadId: 'thread-b' }),
      makeResult({ threadId: 'thread-c' })
    ]
    let state: SearchState = { ...initialSearchState, results, selectedIndex: 0 }
    state = searchReducer(state, { type: 'MOVE_SELECTION', payload: 'down' })
    state = searchReducer(state, { type: 'MOVE_SELECTION', payload: 'down' })
    const selected = state.results[state.selectedIndex]
    expect(selected.threadId).toBe('thread-c')
  })
})
