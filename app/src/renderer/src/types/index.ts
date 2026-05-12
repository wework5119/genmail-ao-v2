import type {
  Account as IpcAccount,
  ThreadSummary,
  Message as IpcMessage,
  Attachment as IpcAttachment
} from '../../../ipc/channels'

export interface Account extends IpcAccount {
  name: string
}

export interface Thread extends ThreadSummary {
  from: { name: string; email: string }
  to: { name: string; email: string }[]
  unread: boolean
  hasAttachments: boolean
  labels: string[]
}

export type Message = IpcMessage
export type Attachment = IpcAttachment

export type View = 'inbox' | 'thread'

export interface ListThreadsParams {
  accountId: string
  cursor?: string
  pageSize?: number
}

export interface ListThreadsResult {
  threads: Thread[]
  nextCursor?: string
  hasMore: boolean
}

export interface GetMessagesParams {
  accountId: string
  threadId: string
  pageParams?: { pageSize: number; pageToken?: string }
}

export interface GetMessagesResult {
  messages: Message[]
  nextPageToken?: string
  hasMore: boolean
}
