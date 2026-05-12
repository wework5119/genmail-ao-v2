/**
 * ComposeContext — app-scoped compose state via useReducer + Context.
 * Provides dispatch and derived helpers to any tree consumer.
 */

import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react'
import {
  composeReducer,
  initialComposeState,
  type ComposeState,
  type ComposeAction,
} from './composeReducer'
import { invoke } from '../../ipc'

interface ComposeContextValue {
  state: ComposeState
  dispatch: React.Dispatch<ComposeAction>
  openCompose: () => void
  openReply: (opts: {
    replyToThreadId: string
    replyToMessageId: string
    replyToAddress: string
    replyToSubject: string
    replyQuotedBody?: string
  }) => void
  send: (accountId: string) => Promise<void>
  requestAiDraft: (accountId: string) => Promise<void>
  /** Callback called after a successful send so parent can refresh inbox */
  onSendSuccess?: () => void
}

const ComposeContext = createContext<ComposeContextValue | null>(null)

export function ComposeProvider({
  children,
  onSendSuccess,
}: {
  children: React.ReactNode
  onSendSuccess?: () => void
}): JSX.Element {
  const [state, dispatch] = useReducer(composeReducer, initialComposeState)
  const sendSuccessRef = useRef(onSendSuccess)
  sendSuccessRef.current = onSendSuccess

  const openCompose = useCallback(() => {
    dispatch({ type: 'OPEN_COMPOSE' })
  }, [])

  const openReply = useCallback(
    (opts: {
      replyToThreadId: string
      replyToMessageId: string
      replyToAddress: string
      replyToSubject: string
      replyQuotedBody?: string
    }) => {
      dispatch({ type: 'OPEN_REPLY', payload: opts })
    },
    []
  )

  const send = useCallback(
    async (accountId: string) => {
      dispatch({ type: 'SEND_START' })
      try {
        // Commit any pending To/Cc inputs before sending
        const pendingTo = state.toInput.trim()
        const toList = [...state.to]
        if (pendingTo.includes('@')) toList.push({ address: pendingTo })

        await invoke('sendMessage', {
          accountId,
          to: toList,
          cc: state.cc.length > 0 ? state.cc : undefined,
          subject: state.subject,
          body: state.body,
          replyToThreadId: state.replyToThreadId,
          replyToMessageId: state.replyToMessageId,
        })
        dispatch({ type: 'SEND_SUCCESS' })
        sendSuccessRef.current?.()
        // Small delay so success state is visible before closing
        setTimeout(() => dispatch({ type: 'CLOSE' }), 600)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to send'
        dispatch({ type: 'SEND_ERROR', payload: msg })
      }
    },
    [state.to, state.toInput, state.cc, state.subject, state.body, state.replyToThreadId, state.replyToMessageId]
  )

  const requestAiDraft = useCallback(
    async (accountId: string) => {
      dispatch({ type: 'AI_DRAFT_START' })
      try {
        const result = await invoke('aiDraft', {
          accountId,
          to: state.to,
          subject: state.subject,
          context: state.replyQuotedBody,
          mode: state.mode,
        })
        dispatch({ type: 'AI_DRAFT_SUCCESS', payload: result.draft })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'AI draft failed'
        dispatch({ type: 'AI_DRAFT_ERROR', payload: msg })
      }
    },
    [state.to, state.subject, state.replyQuotedBody, state.mode]
  )

  return (
    <ComposeContext.Provider
      value={{ state, dispatch, openCompose, openReply, send, requestAiDraft, onSendSuccess }}
    >
      {children}
    </ComposeContext.Provider>
  )
}

export function useCompose(): ComposeContextValue {
  const ctx = useContext(ComposeContext)
  if (!ctx) throw new Error('useCompose must be used inside <ComposeProvider>')
  return ctx
}
