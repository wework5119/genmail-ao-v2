export const IPC_CHANNELS = {
  GET_ACCOUNTS: 'getAccounts',
  LIST_THREADS: 'listThreads',
  GET_MESSAGES: 'getMessages',
  SEND_MESSAGE: 'sendMessage',
  AI_DRAFT: 'aiDraft'
} as const

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS]

export interface Account {
  id: string
  email: string
  displayName: string
  provider: 'gmail' | 'outlook' | 'imap'
  isAuthenticated: boolean
}

export interface PageParams {
  pageSize: number
  pageToken?: string
}

export interface ThreadSummary {
  id: string
  subject: string
  snippet: string
  lastMessageDate: string
  participantNames: string[]
  unreadCount: number
  accountId: string
}

export interface ThreadList {
  threads: ThreadSummary[]
  nextPageToken?: string
  totalEstimate: number
}

export interface Message {
  id: string
  threadId: string
  accountId: string
  subject: string
  from: { name: string; address: string }
  to: { name: string; address: string }[]
  cc?: { name: string; address: string }[]
  bcc?: { name: string; address: string }[]
  body: string
  bodyType: 'text' | 'html'
  sentAt: string
  receivedAt: string
  isRead: boolean
  attachments?: Attachment[]
}

export interface Attachment {
  id: string
  filename: string
  mimeType: string
  sizeBytes: number
}

export interface EmailAddress {
  name?: string
  address: string
}

export interface SendMessageRequest {
  accountId: string
  to: EmailAddress[]
  cc?: EmailAddress[]
  subject: string
  body: string
  /** If replying, the threadId to attach to */
  replyToThreadId?: string
  /** Original message id for In-Reply-To header */
  replyToMessageId?: string
}

export interface SendMessageResponse {
  messageId: string
  threadId: string
  sentAt: string
}

export interface AiDraftRequest {
  accountId: string
  to: EmailAddress[]
  subject: string
  /** Optional context: prior messages for reply drafting */
  context?: string
  /** 'compose' for new email, 'reply' for reply assist */
  mode: 'compose' | 'reply'
}

export interface AiDraftResponse {
  draft: string
}

export interface IpcChannelMap {
  getAccounts: {
    request: void
    response: Account[]
  }
  listThreads: {
    request: { accountId: string; pageParams: PageParams }
    response: ThreadList
  }
  getMessages: {
    request: { accountId: string; threadId: string }
    response: Message[]
  }
  sendMessage: {
    request: SendMessageRequest
    response: SendMessageResponse
  }
  aiDraft: {
    request: AiDraftRequest
    response: AiDraftResponse
  }
}

export type IpcRequest<C extends IpcChannel> =
  C extends keyof IpcChannelMap ? IpcChannelMap[C]['request'] : never

export type IpcResponse<C extends IpcChannel> =
  C extends keyof IpcChannelMap ? IpcChannelMap[C]['response'] : never
