/**
 * Compose state machine — pure reducer, no side effects.
 * Manages draft fields, validation, send lifecycle, and AI draft lifecycle.
 */

export interface RecipientEntry {
  address: string
  name?: string
}

/** Possible send states */
export type SendStatus = 'idle' | 'sending' | 'success' | 'error'

/** Possible AI draft states */
export type AiDraftStatus = 'idle' | 'loading' | 'done' | 'error'

export interface ComposeState {
  /** Whether the compose modal is open */
  isOpen: boolean
  /** New compose vs reply */
  mode: 'compose' | 'reply'
  /** The thread/message being replied to (for pre-fill) */
  replyToThreadId?: string
  replyToMessageId?: string
  replyToAddress?: string
  replyToSubject?: string
  replyQuotedBody?: string

  /** Form fields */
  to: RecipientEntry[]
  cc: RecipientEntry[]
  ccVisible: boolean
  subject: string
  body: string
  /** The current text in the To input (before committed) */
  toInput: string
  /** The current text in the Cc input (before committed) */
  ccInput: string

  /** Lifecycle */
  sendStatus: SendStatus
  sendError?: string
  aiDraftStatus: AiDraftStatus
  aiDraftError?: string

  /** Discard confirmation shown */
  discardConfirmVisible: boolean
}

export const initialComposeState: ComposeState = {
  isOpen: false,
  mode: 'compose',
  to: [],
  cc: [],
  ccVisible: false,
  subject: '',
  body: '',
  toInput: '',
  ccInput: '',
  sendStatus: 'idle',
  aiDraftStatus: 'idle',
  discardConfirmVisible: false,
}

export type ComposeAction =
  | { type: 'OPEN_COMPOSE' }
  | {
      type: 'OPEN_REPLY'
      payload: {
        replyToThreadId: string
        replyToMessageId: string
        replyToAddress: string
        replyToSubject: string
        replyQuotedBody?: string
      }
    }
  | { type: 'CLOSE' }
  | { type: 'DISCARD_REQUEST' }
  | { type: 'DISCARD_CANCEL' }
  | { type: 'DISCARD_CONFIRM' }

  // Field mutations
  | { type: 'SET_TO_INPUT'; payload: string }
  | { type: 'SET_CC_INPUT'; payload: string }
  | { type: 'COMMIT_TO_INPUT' }
  | { type: 'COMMIT_CC_INPUT' }
  | { type: 'REMOVE_TO'; payload: number }
  | { type: 'REMOVE_CC'; payload: number }
  | { type: 'TOGGLE_CC' }
  | { type: 'SET_SUBJECT'; payload: string }
  | { type: 'SET_BODY'; payload: string }

  // Send lifecycle
  | { type: 'SEND_START' }
  | { type: 'SEND_SUCCESS' }
  | { type: 'SEND_ERROR'; payload: string }

  // AI draft lifecycle
  | { type: 'AI_DRAFT_START' }
  | { type: 'AI_DRAFT_SUCCESS'; payload: string }
  | { type: 'AI_DRAFT_ERROR'; payload: string }

/** True when the compose has user-entered content worth confirming before discard */
export function isDirty(state: ComposeState): boolean {
  return (
    state.body.trim().length > 0 ||
    state.to.length > 0 ||
    state.toInput.trim().length > 0 ||
    state.subject.trim().length > 0
  )
}

/** Parse a raw input string into a RecipientEntry */
function parseRecipient(raw: string): RecipientEntry | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  // Support "Display Name <email@example.com>" format
  const match = trimmed.match(/^(.+?)\s*<([^>]+)>$/)
  if (match) {
    return { name: match[1].trim(), address: match[2].trim() }
  }
  // Bare email address
  if (trimmed.includes('@')) {
    return { address: trimmed }
  }
  return null
}

export function composeReducer(state: ComposeState, action: ComposeAction): ComposeState {
  switch (action.type) {
    case 'OPEN_COMPOSE':
      return {
        ...initialComposeState,
        isOpen: true,
        mode: 'compose',
      }

    case 'OPEN_REPLY':
      return {
        ...initialComposeState,
        isOpen: true,
        mode: 'reply',
        replyToThreadId: action.payload.replyToThreadId,
        replyToMessageId: action.payload.replyToMessageId,
        replyToAddress: action.payload.replyToAddress,
        replyToSubject: action.payload.replyToSubject,
        replyQuotedBody: action.payload.replyQuotedBody,
        to: [{ address: action.payload.replyToAddress }],
        subject: action.payload.replyToSubject.startsWith('Re:')
          ? action.payload.replyToSubject
          : `Re: ${action.payload.replyToSubject}`,
      }

    case 'CLOSE':
    case 'DISCARD_CONFIRM':
      return { ...initialComposeState }

    case 'DISCARD_REQUEST':
      if (!isDirty(state)) {
        // Nothing to confirm — close immediately
        return { ...initialComposeState }
      }
      return { ...state, discardConfirmVisible: true }

    case 'DISCARD_CANCEL':
      return { ...state, discardConfirmVisible: false }

    // ── Field mutations ─────────────────────────────────────────
    case 'SET_TO_INPUT':
      return { ...state, toInput: action.payload }

    case 'SET_CC_INPUT':
      return { ...state, ccInput: action.payload }

    case 'COMMIT_TO_INPUT': {
      const recipient = parseRecipient(state.toInput)
      if (!recipient) return { ...state, toInput: '' }
      return {
        ...state,
        to: [...state.to, recipient],
        toInput: '',
      }
    }

    case 'COMMIT_CC_INPUT': {
      const recipient = parseRecipient(state.ccInput)
      if (!recipient) return { ...state, ccInput: '' }
      return {
        ...state,
        cc: [...state.cc, recipient],
        ccInput: '',
      }
    }

    case 'REMOVE_TO':
      return {
        ...state,
        to: state.to.filter((_, i) => i !== action.payload),
      }

    case 'REMOVE_CC':
      return {
        ...state,
        cc: state.cc.filter((_, i) => i !== action.payload),
      }

    case 'TOGGLE_CC':
      return { ...state, ccVisible: !state.ccVisible }

    case 'SET_SUBJECT':
      return { ...state, subject: action.payload }

    case 'SET_BODY':
      return { ...state, body: action.payload }

    // ── Send lifecycle ──────────────────────────────────────────
    case 'SEND_START':
      return { ...state, sendStatus: 'sending', sendError: undefined }

    case 'SEND_SUCCESS':
      return { ...state, sendStatus: 'success' }

    case 'SEND_ERROR':
      return { ...state, sendStatus: 'error', sendError: action.payload }

    // ── AI draft lifecycle ──────────────────────────────────────
    case 'AI_DRAFT_START':
      return { ...state, aiDraftStatus: 'loading', aiDraftError: undefined }

    case 'AI_DRAFT_SUCCESS':
      return { ...state, aiDraftStatus: 'done', body: action.payload }

    case 'AI_DRAFT_ERROR':
      return { ...state, aiDraftStatus: 'error', aiDraftError: action.payload }

    default:
      return state
  }
}
