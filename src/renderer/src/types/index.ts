export interface Account {
  id: string
  email: string
  name: string
  provider: string
  avatarUrl?: string
}

export interface ThreadParticipant {
  name: string
  email: string
}

export interface Thread {
  id: string
  subject: string
  snippet: string
  lastMessageAt: string
  from: ThreadParticipant
  to: ThreadParticipant[]
  unread: boolean
  hasAttachments: boolean
  labels: string[]
}

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
