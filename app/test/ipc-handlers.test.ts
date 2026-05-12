import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn()
  },
  safeStorage: {
    isEncryptionAvailable: vi.fn().mockReturnValue(false),
    encryptString: vi.fn(),
    decryptString: vi.fn()
  },
  app: {
    getPath: vi.fn().mockReturnValue('/tmp/test-user-data')
  }
}))

vi.mock('../src/main/credential-store', () => ({
  credentialStore: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    has: vi.fn(),
    list: vi.fn().mockReturnValue([])
  }
}))

import { registerIpcHandlers } from '../src/main/ipc-handlers'
import { ipcMain } from 'electron'

describe('IPC handler registration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers handlers for all three channels without throwing', () => {
    expect(() => registerIpcHandlers()).not.toThrow()
  })

  it('calls ipcMain.handle exactly three times', () => {
    registerIpcHandlers()
    expect(ipcMain.handle).toHaveBeenCalledTimes(3)
  })

  it('registers getAccounts handler', () => {
    registerIpcHandlers()
    expect(ipcMain.handle).toHaveBeenCalledWith(
      'getAccounts',
      expect.any(Function)
    )
  })

  it('registers listThreads handler', () => {
    registerIpcHandlers()
    expect(ipcMain.handle).toHaveBeenCalledWith(
      'listThreads',
      expect.any(Function)
    )
  })

  it('registers getMessages handler', () => {
    registerIpcHandlers()
    expect(ipcMain.handle).toHaveBeenCalledWith(
      'getMessages',
      expect.any(Function)
    )
  })

  it('registration is idempotent (multiple calls do not throw)', () => {
    registerIpcHandlers()
    registerIpcHandlers()
    expect(ipcMain.handle).toHaveBeenCalledTimes(6)
  })
})
