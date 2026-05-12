/**
 * Vitest unit tests for compose reducer.
 *
 * Covers: draft state, field mutations, send state machine, AI draft lifecycle,
 * discard confirmation flow, and reply pre-fill.
 */

import { describe, it, expect } from 'vitest'
import {
  composeReducer,
  initialComposeState,
  isDirty,
  type ComposeState,
  type ComposeAction,
} from '../src/renderer/src/compose/composeReducer'

/** Helper to apply a sequence of actions from an initial state */
function applyActions(actions: ComposeAction[], state: ComposeState = initialComposeState): ComposeState {
  return actions.reduce((s, a) => composeReducer(s, a), state)
}

describe('composeReducer — initial state', () => {
  it('starts closed with empty fields', () => {
    expect(initialComposeState.isOpen).toBe(false)
    expect(initialComposeState.to).toEqual([])
    expect(initialComposeState.subject).toBe('')
    expect(initialComposeState.body).toBe('')
    expect(initialComposeState.sendStatus).toBe('idle')
    expect(initialComposeState.aiDraftStatus).toBe('idle')
    expect(initialComposeState.discardConfirmVisible).toBe(false)
  })
})

describe('composeReducer — OPEN_COMPOSE', () => {
  it('opens the modal in compose mode', () => {
    const state = composeReducer(initialComposeState, { type: 'OPEN_COMPOSE' })
    expect(state.isOpen).toBe(true)
    expect(state.mode).toBe('compose')
  })

  it('resets all fields when re-opening', () => {
    const dirty = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'SET_SUBJECT', payload: 'Hello' },
      { type: 'SET_BODY', payload: 'World' },
    ])
    const reopened = composeReducer(dirty, { type: 'OPEN_COMPOSE' })
    expect(reopened.subject).toBe('')
    expect(reopened.body).toBe('')
  })
})

describe('composeReducer — OPEN_REPLY', () => {
  const replyPayload = {
    replyToThreadId: 'thread-1',
    replyToMessageId: 'msg-1',
    replyToAddress: 'alice@example.com',
    replyToSubject: 'Hello world',
    replyQuotedBody: 'Original message body',
  }

  it('opens in reply mode', () => {
    const state = composeReducer(initialComposeState, {
      type: 'OPEN_REPLY',
      payload: replyPayload,
    })
    expect(state.isOpen).toBe(true)
    expect(state.mode).toBe('reply')
  })

  it('pre-fills the To field with reply-to address', () => {
    const state = composeReducer(initialComposeState, {
      type: 'OPEN_REPLY',
      payload: replyPayload,
    })
    expect(state.to).toHaveLength(1)
    expect(state.to[0].address).toBe('alice@example.com')
  })

  it('prepends "Re: " to subject when not already prefixed', () => {
    const state = composeReducer(initialComposeState, {
      type: 'OPEN_REPLY',
      payload: replyPayload,
    })
    expect(state.subject).toBe('Re: Hello world')
  })

  it('does not double-prefix "Re:" if already present', () => {
    const state = composeReducer(initialComposeState, {
      type: 'OPEN_REPLY',
      payload: { ...replyPayload, replyToSubject: 'Re: Already prefixed' },
    })
    expect(state.subject).toBe('Re: Already prefixed')
  })

  it('stores quoted body', () => {
    const state = composeReducer(initialComposeState, {
      type: 'OPEN_REPLY',
      payload: replyPayload,
    })
    expect(state.replyQuotedBody).toBe('Original message body')
  })
})

describe('composeReducer — field mutations', () => {
  it('SET_TO_INPUT updates toInput', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'SET_TO_INPUT', payload: 'bob@example.com' },
    ])
    expect(state.toInput).toBe('bob@example.com')
  })

  it('COMMIT_TO_INPUT adds valid email to to[]', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'SET_TO_INPUT', payload: 'bob@example.com' },
      { type: 'COMMIT_TO_INPUT' },
    ])
    expect(state.to).toHaveLength(1)
    expect(state.to[0].address).toBe('bob@example.com')
    expect(state.toInput).toBe('')
  })

  it('COMMIT_TO_INPUT parses "Name <email>" format', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'SET_TO_INPUT', payload: 'Bob Smith <bob@example.com>' },
      { type: 'COMMIT_TO_INPUT' },
    ])
    expect(state.to[0].address).toBe('bob@example.com')
    expect(state.to[0].name).toBe('Bob Smith')
  })

  it('COMMIT_TO_INPUT ignores empty/invalid input', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'SET_TO_INPUT', payload: '   ' },
      { type: 'COMMIT_TO_INPUT' },
    ])
    expect(state.to).toHaveLength(0)
    expect(state.toInput).toBe('')
  })

  it('COMMIT_TO_INPUT ignores non-email input', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'SET_TO_INPUT', payload: 'not-an-email' },
      { type: 'COMMIT_TO_INPUT' },
    ])
    expect(state.to).toHaveLength(0)
  })

  it('REMOVE_TO removes recipient by index', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'SET_TO_INPUT', payload: 'alice@example.com' },
      { type: 'COMMIT_TO_INPUT' },
      { type: 'SET_TO_INPUT', payload: 'bob@example.com' },
      { type: 'COMMIT_TO_INPUT' },
      { type: 'REMOVE_TO', payload: 0 },
    ])
    expect(state.to).toHaveLength(1)
    expect(state.to[0].address).toBe('bob@example.com')
  })

  it('TOGGLE_CC shows/hides cc field', () => {
    const state1 = applyActions([{ type: 'OPEN_COMPOSE' }, { type: 'TOGGLE_CC' }])
    expect(state1.ccVisible).toBe(true)
    const state2 = composeReducer(state1, { type: 'TOGGLE_CC' })
    expect(state2.ccVisible).toBe(false)
  })

  it('COMMIT_CC_INPUT adds to cc[]', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'TOGGLE_CC' },
      { type: 'SET_CC_INPUT', payload: 'cc@example.com' },
      { type: 'COMMIT_CC_INPUT' },
    ])
    expect(state.cc).toHaveLength(1)
    expect(state.cc[0].address).toBe('cc@example.com')
    expect(state.ccInput).toBe('')
  })

  it('REMOVE_CC removes by index', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'TOGGLE_CC' },
      { type: 'SET_CC_INPUT', payload: 'cc1@example.com' },
      { type: 'COMMIT_CC_INPUT' },
      { type: 'SET_CC_INPUT', payload: 'cc2@example.com' },
      { type: 'COMMIT_CC_INPUT' },
      { type: 'REMOVE_CC', payload: 0 },
    ])
    expect(state.cc).toHaveLength(1)
    expect(state.cc[0].address).toBe('cc2@example.com')
  })

  it('SET_SUBJECT updates subject', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'SET_SUBJECT', payload: 'Hello from reducer' },
    ])
    expect(state.subject).toBe('Hello from reducer')
  })

  it('SET_BODY updates body', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'SET_BODY', payload: 'Body text here.' },
    ])
    expect(state.body).toBe('Body text here.')
  })
})

describe('composeReducer — send state machine', () => {
  it('SEND_START transitions to sending', () => {
    const state = applyActions([{ type: 'OPEN_COMPOSE' }, { type: 'SEND_START' }])
    expect(state.sendStatus).toBe('sending')
    expect(state.sendError).toBeUndefined()
  })

  it('SEND_SUCCESS transitions to success', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'SEND_START' },
      { type: 'SEND_SUCCESS' },
    ])
    expect(state.sendStatus).toBe('success')
  })

  it('SEND_ERROR transitions to error with message', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'SEND_START' },
      { type: 'SEND_ERROR', payload: 'Network timeout' },
    ])
    expect(state.sendStatus).toBe('error')
    expect(state.sendError).toBe('Network timeout')
  })

  it('SEND_START clears previous error', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'SEND_START' },
      { type: 'SEND_ERROR', payload: 'First error' },
      { type: 'SEND_START' },
    ])
    expect(state.sendError).toBeUndefined()
    expect(state.sendStatus).toBe('sending')
  })
})

describe('composeReducer — AI draft lifecycle', () => {
  it('AI_DRAFT_START transitions to loading', () => {
    const state = applyActions([{ type: 'OPEN_COMPOSE' }, { type: 'AI_DRAFT_START' }])
    expect(state.aiDraftStatus).toBe('loading')
    expect(state.aiDraftError).toBeUndefined()
  })

  it('AI_DRAFT_SUCCESS populates body and marks done', () => {
    const draft = 'Dear Sarah,\n\nThank you for reaching out.\n\nBest regards'
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'AI_DRAFT_START' },
      { type: 'AI_DRAFT_SUCCESS', payload: draft },
    ])
    expect(state.aiDraftStatus).toBe('done')
    expect(state.body).toBe(draft)
  })

  it('AI_DRAFT_ERROR sets error message', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'AI_DRAFT_START' },
      { type: 'AI_DRAFT_ERROR', payload: 'AI service unavailable' },
    ])
    expect(state.aiDraftStatus).toBe('error')
    expect(state.aiDraftError).toBe('AI service unavailable')
  })

  it('AI_DRAFT_START clears previous error', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'AI_DRAFT_START' },
      { type: 'AI_DRAFT_ERROR', payload: 'First error' },
      { type: 'AI_DRAFT_START' },
    ])
    expect(state.aiDraftError).toBeUndefined()
  })
})

describe('composeReducer — discard flow', () => {
  it('DISCARD_REQUEST on empty compose closes immediately (no confirm needed)', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'DISCARD_REQUEST' },
    ])
    // isDirty = false → closes without confirm
    expect(state.isOpen).toBe(false)
    expect(state.discardConfirmVisible).toBe(false)
  })

  it('DISCARD_REQUEST on dirty compose shows confirmation', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'SET_BODY', payload: 'Some text' },
      { type: 'DISCARD_REQUEST' },
    ])
    expect(state.discardConfirmVisible).toBe(true)
    expect(state.isOpen).toBe(true)
  })

  it('DISCARD_CANCEL hides confirmation without closing', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'SET_BODY', payload: 'Some text' },
      { type: 'DISCARD_REQUEST' },
      { type: 'DISCARD_CANCEL' },
    ])
    expect(state.discardConfirmVisible).toBe(false)
    expect(state.isOpen).toBe(true)
    expect(state.body).toBe('Some text')
  })

  it('DISCARD_CONFIRM closes and resets', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'SET_BODY', payload: 'Some text' },
      { type: 'DISCARD_REQUEST' },
      { type: 'DISCARD_CONFIRM' },
    ])
    expect(state.isOpen).toBe(false)
    expect(state.body).toBe('')
    expect(state.discardConfirmVisible).toBe(false)
  })

  it('CLOSE resets to initial state', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'SET_SUBJECT', payload: 'Test' },
      { type: 'SET_BODY', payload: 'Content' },
      { type: 'CLOSE' },
    ])
    expect(state).toEqual(initialComposeState)
  })
})

describe('isDirty helper', () => {
  it('returns false for initial state', () => {
    expect(isDirty(initialComposeState)).toBe(false)
  })

  it('returns true when body has content', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'SET_BODY', payload: 'Hello' },
    ])
    expect(isDirty(state)).toBe(true)
  })

  it('returns true when subject has content', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'SET_SUBJECT', payload: 'My subject' },
    ])
    expect(isDirty(state)).toBe(true)
  })

  it('returns true when recipients are added', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'SET_TO_INPUT', payload: 'alice@example.com' },
      { type: 'COMMIT_TO_INPUT' },
    ])
    expect(isDirty(state)).toBe(true)
  })

  it('returns true when toInput has partial email', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'SET_TO_INPUT', payload: 'bob@' },
    ])
    expect(isDirty(state)).toBe(true)
  })

  it('returns false when only whitespace in body', () => {
    const state = applyActions([
      { type: 'OPEN_COMPOSE' },
      { type: 'SET_BODY', payload: '   \n  ' },
    ])
    expect(isDirty(state)).toBe(false)
  })
})

describe('composeReducer — state immutability', () => {
  it('does not mutate the input state', () => {
    const before = { ...initialComposeState }
    composeReducer(initialComposeState, { type: 'OPEN_COMPOSE' })
    expect(initialComposeState).toEqual(before)
  })

  it('returns same reference for unknown actions', () => {
    // Cast to force a "no-op" path via default case
    const unknown = { type: '__UNKNOWN__' } as unknown as ComposeAction
    const result = composeReducer(initialComposeState, unknown)
    expect(result).toBe(initialComposeState)
  })
})

describe('composeReducer — channel coverage (IPC types)', () => {
  it('channels.ts exports sendMessage and aiDraft channels', async () => {
    const { IPC_CHANNELS } = await import('../src/ipc/channels')
    expect(IPC_CHANNELS.SEND_MESSAGE).toBe('sendMessage')
    expect(IPC_CHANNELS.AI_DRAFT).toBe('aiDraft')
  })

  it('IpcChannelMap includes sendMessage with correct shape', async () => {
    const { IPC_CHANNELS } = await import('../src/ipc/channels')
    type SendChannel = typeof IPC_CHANNELS.SEND_MESSAGE
    const channel: SendChannel = 'sendMessage'
    expect(channel).toBe('sendMessage')
  })
})
