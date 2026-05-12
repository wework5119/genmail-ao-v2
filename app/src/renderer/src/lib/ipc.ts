import type { Account as IpcAccount, ThreadSummary } from '../../../ipc/channels'
import type {
  Account,
  Thread,
  ListThreadsParams,
  ListThreadsResult,
  GetMessagesParams,
  GetMessagesResult,
  SearchParams,
  SearchResultsData
} from '../types'
import { invoke } from '../../ipc'

function toThread(summary: ThreadSummary): Thread {
  return {
    ...summary,
    from: { name: summary.participantNames[0] ?? 'Unknown', email: '' },
    to: [],
    unread: summary.unreadCount > 0,
    hasAttachments: false,
    labels: []
  }
}

export async function getAccounts(): Promise<Account[]> {
  const accounts = await invoke('getAccounts')
  return accounts.map((a: IpcAccount) => ({
    ...a,
    name: a.displayName
  }))
}

export async function listThreads(
  params: ListThreadsParams
): Promise<ListThreadsResult> {
  const result = await invoke('listThreads', {
    accountId: params.accountId,
    pageParams: {
      pageSize: params.pageSize ?? 25,
      pageToken: params.cursor
    }
  })
  return {
    threads: result.threads.map(toThread),
    nextCursor: result.nextPageToken,
    hasMore: !!result.nextPageToken
  }
}

export async function getMessages(
  params: GetMessagesParams
): Promise<GetMessagesResult> {
  const result = await invoke('getMessages', {
    accountId: params.accountId,
    threadId: params.threadId,
    pageParams: params.pageParams ?? { pageSize: 20 }
  })
  return {
    messages: result.messages,
    nextPageToken: result.nextPageToken,
    hasMore: result.hasMore
  }
}

export async function searchThreads(
  params: SearchParams
): Promise<SearchResultsData> {
  const result = await invoke('searchThreads', {
    accountId: params.accountId,
    query: params.query
  })
  return {
    results: result.results,
    query: result.query
  }
}
