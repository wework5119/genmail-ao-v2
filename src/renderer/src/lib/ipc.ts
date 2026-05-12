import type { Account, ListThreadsParams, ListThreadsResult } from '../types'

const api = window.electronAPI

export async function getAccounts(): Promise<Account[]> {
  return api?.getAccounts() ?? []
}

export async function listThreads(
  params: ListThreadsParams
): Promise<ListThreadsResult> {
  return api?.listThreads(params) ?? { threads: [], hasMore: false }
}
