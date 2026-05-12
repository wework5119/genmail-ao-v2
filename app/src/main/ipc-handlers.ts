import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../ipc/channels'
import type { Account, ThreadList, Message } from '../ipc/channels'
import { credentialStore } from './credential-store'

const GENMAIL_API_BASE_URL = process.env.GENMAIL_API_BASE_URL ?? 'https://api.genmail.app'

function apiBaseUrl(): string {
  return GENMAIL_API_BASE_URL
}

function authHeaders(accountId: string): Record<string, string> {
  const creds = credentialStore.get(accountId)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (creds?.accessToken) {
    headers['Authorization'] = `Bearer ${creds.accessToken}`
  }
  return headers
}

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.GET_ACCOUNTS, async (): Promise<Account[]> => {
    const accountIds = credentialStore.list()
    if (accountIds.length === 0) {
      return [
        {
          id: 'default',
          email: process.env.GENMAIL_DEFAULT_EMAIL ?? 'user@genmail.app',
          displayName: process.env.GENMAIL_DEFAULT_DISPLAY_NAME ?? 'Default Account',
          provider: 'gmail',
          isAuthenticated: !!process.env.GENMAIL_DEFAULT_ACCESS_TOKEN
        }
      ]
    }
    return accountIds.map((id) => {
      const creds = credentialStore.get(id)
      return {
        id,
        email: id,
        displayName: id,
        provider: 'gmail' as const,
        isAuthenticated: !!creds?.accessToken
      }
    })
  })

  ipcMain.handle(
    IPC_CHANNELS.LIST_THREADS,
    async (
      _event,
      payload: { accountId: string; pageParams: { pageSize: number; pageToken?: string } }
    ): Promise<ThreadList> => {
      const { accountId, pageParams } = payload
      const baseUrl = apiBaseUrl()
      const params = new URLSearchParams({
        pageSize: String(pageParams.pageSize)
      })
      if (pageParams.pageToken) {
        params.set('pageToken', pageParams.pageToken)
      }
      const url = `${baseUrl}/api/ai-inbox/${encodeURIComponent(accountId)}/threads?${params.toString()}`
      const res = await fetch(url, {
        method: 'GET',
        headers: authHeaders(accountId)
      })
      if (!res.ok) {
        throw new Error(`Failed to list threads: ${res.status} ${res.statusText}`)
      }
      return res.json()
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GET_MESSAGES,
    async (_event, payload: { accountId: string; threadId: string }): Promise<Message[]> => {
      const { accountId, threadId } = payload
      const baseUrl = apiBaseUrl()
      const url = `${baseUrl}/api/ai-inbox/threads/${encodeURIComponent(threadId)}/messages`
      const res = await fetch(url, {
        method: 'GET',
        headers: authHeaders(accountId)
      })
      if (!res.ok) {
        throw new Error(`Failed to get messages: ${res.status} ${res.statusText}`)
      }
      return res.json()
    }
  )
}
