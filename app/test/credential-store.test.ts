import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSafeStorage, mockApp } = vi.hoisted(() => ({
  mockSafeStorage: {
    isEncryptionAvailable: vi.fn().mockReturnValue(true),
    encryptString: vi.fn((s: string) => Buffer.from(s)),
    decryptString: vi.fn((b: Buffer) => b.toString())
  },
  mockApp: {
    getPath: vi.fn().mockReturnValue('/tmp/test-user-data')
  }
}))

vi.mock('electron', () => ({
  safeStorage: mockSafeStorage,
  app: mockApp
}))

import { CredentialStore } from '../src/main/credential-store'

describe('CredentialStore', () => {
  let store: CredentialStore

  beforeEach(() => {
    vi.clearAllMocks()
    store = new CredentialStore()
  })

  it('constructs without throwing', () => {
    expect(store).toBeInstanceOf(CredentialStore)
  })

  it('returns null for unknown account', () => {
    expect(store.get('nonexistent')).toBeNull()
  })

  it('stores and retrieves credentials', () => {
    store.set('acc-1', {
      accessToken: 'tok_abc123',
      refreshToken: 'ref_xyz789',
      expiresAt: Date.now() + 3600000
    })
    const result = store.get('acc-1')
    expect(result).not.toBeNull()
    expect(result!.accessToken).toBe('tok_abc123')
    expect(result!.refreshToken).toBe('ref_xyz789')
    expect(result!.expiresAt).toBeGreaterThan(0)
  })

  it('overwrites existing credentials for same account', () => {
    store.set('acc-1', { accessToken: 'old_token' })
    store.set('acc-1', { accessToken: 'new_token' })
    expect(store.get('acc-1')!.accessToken).toBe('new_token')
  })

  it('deletes credentials', () => {
    store.set('acc-1', { accessToken: 'tok_abc' })
    expect(store.has('acc-1')).toBe(true)
    store.delete('acc-1')
    expect(store.has('acc-1')).toBe(false)
    expect(store.get('acc-1')).toBeNull()
  })

  it('lists account IDs', () => {
    store.set('acc-1', { accessToken: 'a' })
    store.set('acc-2', { accessToken: 'b' })
    const ids = store.list()
    expect(ids).toContain('acc-1')
    expect(ids).toContain('acc-2')
  })

  it('uses safeStorage.encryptString when available', () => {
    mockSafeStorage.isEncryptionAvailable.mockReturnValue(true)
    store.set('acc-secure', { accessToken: 'secret_token' })
    expect(mockSafeStorage.encryptString).toHaveBeenCalled()
  })
})
