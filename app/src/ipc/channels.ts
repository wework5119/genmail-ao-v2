export const IPC_CHANNELS = {
  GET_ACCOUNTS: 'getAccounts',
  LIST_THREADS: 'listThreads',
  GET_MESSAGES: 'getMessages',
  SEARCH_THREADS: 'searchThreads'
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

export interface MessageList {
  messages: Message[]
  nextPageToken?: string
  hasMore: boolean
}

export interface SearchResult {
  threadId: string
  subject: string
  snippet: string
  sender: { name: string; email: string }
  date: string
  unread: boolean
}

export interface SearchResults {
  results: SearchResult[]
  query: string
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
    request: { accountId: string; threadId: string; pageParams?: PageParams }
    response: MessageList
  }
  searchThreads: {
    request: { accountId: string; query: string }
    response: SearchResults
  }
}

export type IpcRequest<C extends IpcChannel> =
  C extends keyof IpcChannelMap ? IpcChannelMap[C]['request'] : never

export type IpcResponse<C extends IpcChannel> =
  C extends keyof IpcChannelMap ? IpcChannelMap[C]['response'] : never
