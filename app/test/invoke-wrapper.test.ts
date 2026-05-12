import { describe, it, expect } from 'vitest'
import type { IpcChannel, IpcRequest, IpcResponse } from '../src/ipc/channels'
import type { Account, ThreadList, Message } from '../src/ipc/channels'

describe('Typed invoke wrapper (type-level tests)', () => {
  it('invoke<"getAccounts"> resolves to Account[]', () => {
    type InvokeResult = IpcResponse<'getAccounts'>
    const accounts: InvokeResult = [] as Account[]
    expect(Array.isArray(accounts)).toBe(true)
  })

  it('invoke<"listThreads"> request includes accountId and pageParams', () => {
    type ListThreadsReq = IpcRequest<'listThreads'>
    const req: ListThreadsReq = {
      accountId: 'acc-1',
      pageParams: { pageSize: 50, pageToken: 'next-page' }
    }
    expect(req.accountId).toBe('acc-1')
    expect(req.pageParams.pageSize).toBe(50)
    expect(req.pageParams.pageToken).toBe('next-page')
  })

  it('invoke<"listThreads"> response is ThreadList', () => {
    type Res = IpcResponse<'listThreads'>
    const response: Res = {
      threads: [
        {
          id: 'thread-1',
          subject: 'Hello',
          snippet: '...',
          lastMessageDate: '2024-01-01T00:00:00Z',
          participantNames: ['Alice'],
          unreadCount: 1,
          accountId: 'acc-1'
        }
      ],
      nextPageToken: 'page-2',
      totalEstimate: 1
    }
    expect(response.threads).toHaveLength(1)
    expect(response.nextPageToken).toBe('page-2')
  })

  it('invoke<"getMessages"> request has accountId, threadId, and optional pageParams', () => {
    type Req = IpcRequest<'getMessages'>
    const req: Req = { accountId: 'acc-1', threadId: 'thread-42', pageParams: { pageSize: 20 } }
    expect(req.accountId).toBe('acc-1')
    expect(req.threadId).toBe('thread-42')
    expect(req.pageParams?.pageSize).toBe(20)
  })

  it('invoke<"getMessages"> response resolves to MessageList', () => {
    type Res = IpcResponse<'getMessages'>
    const result: Res = { messages: [], hasMore: false, nextPageToken: undefined }
    expect(Array.isArray(result.messages)).toBe(true)
    expect(result.hasMore).toBe(false)
  })

  it('channel type union works with invoke function signature', () => {
    type InvokeFn = <C extends IpcChannel>(
      channel: C,
      ...args: IpcRequest<C> extends void ? [] : [IpcRequest<C>]
    ) => Promise<IpcResponse<C>>

    const mockInvoke: InvokeFn = ((_channel: IpcChannel) =>
      Promise.resolve(undefined)) as InvokeFn

    expect(typeof mockInvoke).toBe('function')
  })

  it('discriminated union dispatches correct params per channel', () => {
    type GetAccountsParams = Parameters<
      <C extends IpcChannel>(channel: C, ...args: IpcRequest<C> extends void ? [] : [IpcRequest<C>]) => void
    >

    const params: GetAccountsParams = ['getAccounts']
    expect(params[0]).toBe('getAccounts')
    expect(params).toHaveLength(1)
  })
})
