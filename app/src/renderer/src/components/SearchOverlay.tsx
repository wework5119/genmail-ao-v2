import React, { useEffect, useRef, useCallback, useState } from 'react'
import { useInbox } from '../context/InboxContext'
import { useSearch } from '../hooks/useSearch'
import { formatRelativeTime } from '../lib/time'
import type { SearchResult } from '../types'

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Deterministic avatar color based on name
const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
]

function avatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

interface SearchResultRowProps {
  result: SearchResult
  selected: boolean
  onSelect: () => void
  onMouseEnter: () => void
}

function SearchResultRow({ result, selected, onSelect, onMouseEnter }: SearchResultRowProps) {
  const rowRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (selected && rowRef.current) {
      rowRef.current.scrollIntoView({ block: 'nearest' })
    }
  }, [selected])

  const initials = getInitials(result.sender.name || result.sender.email)
  const colorClass = avatarColor(result.sender.name || result.sender.email)

  return (
    <button
      ref={rowRef}
      type="button"
      role="option"
      aria-selected={selected}
      className={[
        'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors duration-75',
        'focus:outline-none cursor-default',
        selected
          ? 'bg-accent-50 border-l-2 border-accent-500'
          : 'border-l-2 border-transparent hover:bg-neutral-50'
      ].join(' ')}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
    >
      {/* Avatar */}
      <div
        className={[
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          'text-xs font-semibold select-none',
          colorClass
        ].join(' ')}
        aria-hidden="true"
      >
        {initials}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          {/* Sender name */}
          <span
            className={[
              'text-sm font-medium truncate',
              selected ? 'text-accent-700' : 'text-text-primary'
            ].join(' ')}
          >
            {result.sender.name || result.sender.email}
          </span>
          {/* Date */}
          <span className="flex-shrink-0 text-2xs text-text-tertiary tabular-nums">
            {formatRelativeTime(result.date)}
          </span>
        </div>
        {/* Subject */}
        <div className="flex items-center gap-1.5 mt-0.5">
          {result.unread && (
            <span
              className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-accent-500"
              aria-label="Unread"
            />
          )}
          <p
            className={[
              'text-sm truncate',
              result.unread ? 'font-medium text-text-primary' : 'font-normal text-text-primary'
            ].join(' ')}
          >
            {result.subject}
          </p>
        </div>
        {/* Snippet */}
        {result.snippet && (
          <p className="text-xs text-text-secondary truncate mt-0.5 leading-snug">
            {result.snippet}
          </p>
        )}
      </div>
    </button>
  )
}

function Spinner() {
  return (
    <div
      className="flex items-center justify-center py-6"
      role="status"
      aria-label="Searching…"
    >
      <div className="w-5 h-5 rounded-full border-2 border-neutral-200 border-t-accent-500 animate-spin" />
    </div>
  )
}

interface SearchOverlayProps {
  onClose: () => void
}

export default function SearchOverlay({ onClose }: SearchOverlayProps) {
  const { state: inboxState, navigateToThread } = useInbox()
  const { state: searchState, setQuery, moveSelection, clear } = useSearch({
    accountId: inboxState.selectedAccountId,
    debounceMs: 200,
    spinnerDelayMs: 500
  })
  const inputRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState('')

  // Autofocus input on open
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleOpenResult = useCallback(
    (result: SearchResult) => {
      navigateToThread(result.threadId)
      onClose()
    },
    [navigateToThread, onClose]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        if (inputValue.length > 0) {
          // First Esc: clear text
          setInputValue('')
          setQuery('')
          clear()
        } else {
          // Second Esc: close overlay
          onClose()
        }
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        moveSelection('down')
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        moveSelection('up')
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const selected = searchState.results[searchState.selectedIndex]
        if (selected) {
          handleOpenResult(selected)
        }
        return
      }
    },
    [inputValue, searchState.results, searchState.selectedIndex, setQuery, clear, moveSelection, handleOpenResult, onClose]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      setInputValue(val)
      setQuery(val)
    },
    [setQuery]
  )

  // Backdrop click closes
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    },
    [onClose]
  )

  const showResults = searchState.results.length > 0 && inputValue.trim().length > 0
  const showEmpty =
    !searchState.loading &&
    !searchState.showSpinner &&
    inputValue.trim().length > 0 &&
    searchState.debouncedQuery.trim().length > 0 &&
    searchState.results.length === 0 &&
    !searchState.error
  const showInitialState = inputValue.trim().length === 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center"
      style={{ paddingTop: '20vh' }}
      aria-modal="true"
      role="dialog"
      aria-label="Search mail"
      onClick={handleBackdropClick}
      data-testid="search-overlay"
    >
      {/* Backdrop — pointer-events-none so clicks pass through to the outer container handler */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px] pointer-events-none"
        aria-hidden="true"
      />

      {/* Palette panel */}
      <div
        ref={overlayRef}
        className={[
          'relative w-full max-w-[600px] mx-4',
          'bg-white rounded-xl shadow-palette',
          'border border-neutral-200/80',
          'flex flex-col overflow-hidden',
          'max-h-[560px]'
        ].join(' ')}
        data-testid="search-panel"
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100">
          {/* Search icon */}
          <svg
            className="flex-shrink-0 w-4 h-4 text-neutral-500"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="6.5" cy="6.5" r="4" />
            <line x1="10" y1="10" x2="14" y2="14" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showResults}
            aria-controls="search-results-list"
            aria-activedescendant={
              showResults ? `search-result-${searchState.selectedIndex}` : undefined
            }
            className={[
              'flex-1 bg-transparent text-sm text-text-primary',
              'placeholder:text-neutral-500',
              'focus:outline-none',
              'caret-accent-500'
            ].join(' ')}
            placeholder="Search mail…"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
            data-testid="search-input"
          />

          {/* Spinner or clear button */}
          {searchState.showSpinner ? (
            <div
              className="flex-shrink-0 w-4 h-4 rounded-full border-2 border-neutral-200 border-t-accent-500 animate-spin"
              role="status"
              aria-label="Searching…"
            />
          ) : inputValue.length > 0 ? (
            <button
              type="button"
              className="flex-shrink-0 w-5 h-5 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
              onClick={() => {
                setInputValue('')
                setQuery('')
                clear()
                inputRef.current?.focus()
              }}
              aria-label="Clear search"
              tabIndex={-1}
            >
              <svg
                className="w-3 h-3 text-neutral-500"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <line x1="2" y1="2" x2="10" y2="10" />
                <line x1="10" y1="2" x2="2" y2="10" />
              </svg>
            </button>
          ) : null}

          {/* Esc hint */}
          <kbd
            className="flex-shrink-0 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-2xs font-mono text-neutral-500 bg-neutral-50 border border-neutral-200 rounded"
            aria-hidden="true"
          >
            esc
          </kbd>
        </div>

        {/* Results area */}
        <div className="flex-1 overflow-y-auto scrollable min-h-0">
          {/* Initial state — hint */}
          {showInitialState && (
            <div className="flex flex-col items-center justify-center py-10 px-6 gap-2">
              <svg
                className="w-8 h-8 text-neutral-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="6" />
                <line x1="16" y1="16" x2="21" y2="21" />
              </svg>
              <p className="text-sm text-neutral-500 text-center">
                Type to search across all mail
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-2xs text-neutral-500">
                  <kbd className="px-1 py-0.5 font-mono bg-neutral-50 border border-neutral-200 rounded text-2xs">↑</kbd>
                  <kbd className="px-1 py-0.5 font-mono bg-neutral-50 border border-neutral-200 rounded text-2xs">↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1 text-2xs text-neutral-500">
                  <kbd className="px-1 py-0.5 font-mono bg-neutral-50 border border-neutral-200 rounded text-2xs">↵</kbd>
                  open
                </span>
                <span className="flex items-center gap-1 text-2xs text-neutral-500">
                  <kbd className="px-1 py-0.5 font-mono bg-neutral-50 border border-neutral-200 rounded text-2xs">esc</kbd>
                  dismiss
                </span>
              </div>
            </div>
          )}

          {/* Loading spinner (>500ms) */}
          {!showInitialState && searchState.showSpinner && !showResults && (
            <Spinner />
          )}

          {/* Results list */}
          {showResults && (
            <ul
              id="search-results-list"
              role="listbox"
              aria-label="Search results"
              className="py-1"
              data-testid="search-results"
            >
              {/* Results count hint */}
              <li
                className="px-4 py-1.5 text-2xs text-neutral-500 font-medium uppercase tracking-wide select-none"
                role="presentation"
              >
                {searchState.results.length === 20
                  ? 'Top 20 results'
                  : `${searchState.results.length} result${searchState.results.length !== 1 ? 's' : ''}`}
              </li>
              {searchState.results.map((result, idx) => (
                <li
                  key={result.threadId}
                  id={`search-result-${idx}`}
                  role="presentation"
                >
                  <SearchResultRow
                    result={result}
                    selected={idx === searchState.selectedIndex}
                    onSelect={() => handleOpenResult(result)}
                    onMouseEnter={() => {
                      // Move keyboard selection to match mouse hover
                      if (idx !== searchState.selectedIndex) {
                        // Direct dispatch via moveSelection isn't granular enough for arbitrary index
                        // We set via repeated moves; instead use a custom approach
                        // For simplicity, just dispatch enough moves
                        const delta = idx - searchState.selectedIndex
                        const dir = delta > 0 ? 'down' : 'up'
                        for (let i = 0; i < Math.abs(delta); i++) {
                          moveSelection(dir)
                        }
                      }
                    }}
                  />
                </li>
              ))}
            </ul>
          )}

          {/* Empty state */}
          {showEmpty && (
            <div
              className="flex flex-col items-center justify-center py-10 px-6 gap-2"
              data-testid="search-empty"
            >
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-neutral-400"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="9" cy="9" r="5" />
                  <line x1="13" y1="13" x2="17" y2="17" />
                  <line x1="7" y1="9" x2="11" y2="9" />
                </svg>
              </div>
              <p className="text-sm font-medium text-text-primary text-center">
                No results for &ldquo;{searchState.debouncedQuery}&rdquo;
              </p>
              <p className="text-xs text-text-secondary text-center">
                Try a different search
              </p>
            </div>
          )}

          {/* Error state */}
          {searchState.error && !showInitialState && (
            <div className="flex flex-col items-center justify-center py-10 px-6 gap-2">
              <div className="w-10 h-10 rounded-full bg-danger-50 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-danger-500"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="10" cy="10" r="7" />
                  <line x1="10" y1="7" x2="10" y2="10.5" />
                  <line x1="10" y1="13" x2="10" y2="13.5" />
                </svg>
              </div>
              <p className="text-sm font-medium text-text-primary text-center">
                Search unavailable
              </p>
              <p className="text-xs text-text-secondary text-center">
                Something went wrong. Please try again.
              </p>
            </div>
          )}
        </div>

        {/* Footer hint */}
        {showResults && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-neutral-100 bg-neutral-50/50">
            <span className="text-2xs text-neutral-500">
              Press{' '}
              <kbd className="px-1 py-0.5 font-mono bg-white border border-neutral-200 rounded text-2xs">↵</kbd>
              {' '}to open
            </span>
            <span className="text-2xs text-neutral-500">
              <kbd className="px-1 py-0.5 font-mono bg-white border border-neutral-200 rounded text-2xs">↑</kbd>
              {' '}
              <kbd className="px-1 py-0.5 font-mono bg-white border border-neutral-200 rounded text-2xs">↓</kbd>
              {' '}to navigate
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
