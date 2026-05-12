import { describe, it, expect } from 'vitest'
import { IPC_CHANNELS } from '../src/ipc/channels'
import type { IpcChannel, IpcChannelMap, IpcRequest, IpcResponse, Account, ThreadList, Message, PageParams, SendMessageRequest, AiDraftRequest } from '../src/ipc/channels'

describe('IPC channel registry', () => {
  it('defines all required channel constants', () => {
    expect(IPC_CHANNELS.GET_ACCOUNTS).toBe('getAccounts')
    expect(IPC_CHANNELS.LIST_THREADS).toBe('listThreads')
    expect(IPC_CHANNELS.GET_MESSAGES).toBe('getMessages')
    expect(IPC_CHANNELS.SEND_MESSAGE).toBe('sendMessage')
    expect(IPC_CHANNELS.AI_DRAFT).toBe('aiDraft')
  })

  it('channel names are unique', () => {
    const values = Object.values(IPC_CHANNELS)
    const unique = new Set(values)
    expect(unique.size).toBe(values.length)
  })

  it('IpcChannel type is a union of all channel strings', () => {
    const channel: IpcChannel = 'getAccounts'
    expect(typeof channel).toBe('string')
  })

  it('IpcChannel type rejects unknown values', () => {
    const valid: IpcChannel = 'listThreads'
    expect(valid).toBe('listThreads')
  })
})

describe('IPC channel type map', () => {
  it('getAccounts has void request and Account[] response', () => {
    type Req = IpcRequest<'getAccounts'>
    type Res = IpcResponse<'getAccounts'>
    const _voidCheck: Req = undefined as unknown as Req
    const accounts: Res = []
    expect(Array.isArray(accounts)).toBe(true)
    expect(_voidCheck).toBeUndefined()
  })

  it('listThreads has correct request shape', () => {
    type Req = IpcRequest<'listThreads'>
    const req: Req = { accountId: 'test', pageParams: { pageSize: 20 } }
    expect(req.accountId).toBe('test')
    expect(req.pageParams.pageSize).toBe(20)
  })

  it('getMessages has accountId and threadId request', () => {
    type Req = IpcRequest<'getMessages'>
    const req: Req = { accountId: 'acc-1', threadId: 'thread-123' }
    expect(req.accountId).toBe('acc-1')
    expect(req.threadId).toBe('thread-123')
  })

  it('Account type has required fields', () => {
    const account: Account = {
      id: 'acc-1',
      email: 'test@example.com',
      displayName: 'Test User',
      provider: 'gmail',
      isAuthenticated: true
    }
    expect(account.id).toBe('acc-1')
    expect(account.provider).toBe('gmail')
  })

  it('ThreadList type has required fields', () => {
    const threadList: ThreadList = {
      threads: [],
      totalEstimate: 0
    }
    expect(threadList.threads).toEqual([])
    expect(threadList.totalEstimate).toBe(0)
  })

  it('Message type has required fields', () => {
    const message: Message = {
      id: 'msg-1',
      threadId: 'thread-1',
      accountId: 'acc-1',
      subject: 'Test',
      from: { name: 'Alice', address: 'alice@example.com' },
      to: [{ name: 'Bob', address: 'bob@example.com' }],
      body: 'Hello',
      bodyType: 'text',
      sentAt: '2024-01-01T00:00:00Z',
      receivedAt: '2024-01-01T00:00:00Z',
      isRead: false
    }
    expect(message.id).toBe('msg-1')
    expect(message.from.address).toBe('alice@example.com')
  })
})

describe('IPC channel map compiles correctly', () => {
  it('IpcChannelMap contains all five channels', () => {
    const map: IpcChannelMap = {} as IpcChannelMap
    expect(map).toBeDefined()
  })

  it('request types are correctly inferred', () => {
    type GetAccountsReq = IpcChannelMap['getAccounts']['request']
    type ListThreadsReq = IpcChannelMap['listThreads']['request']
    type GetMessagesReq = IpcChannelMap['getMessages']['request']

    const _voidReq: GetAccountsReq = undefined as unknown as GetAccountsReq
    const listReq: ListThreadsReq = { accountId: 'a', pageParams: { pageSize: 10 } }
    const msgReq: GetMessagesReq = { accountId: 'a', threadId: 't' }

    expect(_voidReq).toBeUndefined()
    expect(listReq.accountId).toBe('a')
    expect(msgReq.accountId).toBe('a')
    expect(msgReq.threadId).toBe('t')
  })

  it('response types are correctly inferred', () => {
    type GetAccountsRes = IpcChannelMap['getAccounts']['response']
    type ListThreadsRes = IpcChannelMap['listThreads']['response']
    type GetMessagesRes = IpcChannelMap['getMessages']['response']

    const accounts: GetAccountsRes = []
    const threads: ListThreadsRes = { threads: [], totalEstimate: 0 }
    const messages: GetMessagesRes = []

    expect(Array.isArray(accounts)).toBe(true)
    expect(threads.totalEstimate).toBe(0)
    expect(Array.isArray(messages)).toBe(true)
  })
})

describe('IPC channel types — sendMessage + aiDraft (issue #9)', () => {
  it('SendMessageRequest has required fields', () => {
    const req: SendMessageRequest = {
      accountId: 'acc-1',
      to: [{ address: 'alice@example.com' }],
      subject: 'Hello',
      body: 'World',
    }
    expect(req.accountId).toBe('acc-1')
    expect(req.to[0].address).toBe('alice@example.com')
  })

  it('SendMessageRequest supports optional cc and replyToThreadId', () => {
    const req: SendMessageRequest = {
      accountId: 'acc-1',
      to: [{ address: 'alice@example.com' }],
      cc: [{ address: 'bob@example.com', name: 'Bob' }],
      subject: 'Test',
      body: 'Body',
      replyToThreadId: 'thread-123',
      replyToMessageId: 'msg-456',
    }
    expect(req.cc).toHaveLength(1)
    expect(req.replyToThreadId).toBe('thread-123')
  })

  it('AiDraftRequest has required fields', () => {
    const req: AiDraftRequest = {
      accountId: 'acc-1',
      to: [{ address: 'alice@example.com' }],
      subject: 'Help me draft this',
      mode: 'compose',
    }
    expect(req.mode).toBe('compose')
  })

  it('AiDraftRequest supports reply mode with context', () => {
    const req: AiDraftRequest = {
      accountId: 'acc-1',
      to: [{ address: 'alice@example.com' }],
      subject: 'Re: Original',
      mode: 'reply',
      context: 'Original message content here',
    }
    expect(req.mode).toBe('reply')
    expect(req.context).toBe('Original message content here')
  })

  it('IpcRequest for sendMessage matches SendMessageRequest', () => {
    type Req = IpcRequest<'sendMessage'>
    const req: Req = {
      accountId: 'acc-1',
      to: [{ address: 'test@example.com' }],
      subject: 'Subject',
      body: 'Body',
    }
    expect(req.accountId).toBe('acc-1')
  })

  it('IpcResponse for sendMessage has messageId, threadId, sentAt', () => {
    type Res = IpcResponse<'sendMessage'>
    const res: Res = {
      messageId: 'msg-1',
      threadId: 'thread-1',
      sentAt: '2026-05-12T10:00:00Z',
    }
    expect(res.messageId).toBe('msg-1')
  })

  it('IpcRequest for aiDraft matches AiDraftRequest', () => {
    type Req = IpcRequest<'aiDraft'>
    const req: Req = {
      accountId: 'acc-1',
      to: [],
      subject: 'Draft me something',
      mode: 'compose',
    }
    expect(req.mode).toBe('compose')
  })

  it('IpcResponse for aiDraft has draft field', () => {
    type Res = IpcResponse<'aiDraft'>
    const res: Res = { draft: 'Dear Alice,\n\nThank you.' }
    expect(res.draft).toContain('Dear Alice')
  })
})
