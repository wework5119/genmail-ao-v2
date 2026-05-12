import { safeStorage } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'

interface StoredCredentials {
  [accountId: string]: {
    accessToken: string
    refreshToken?: string
    expiresAt?: number
  }
}

export class CredentialStore {
  private filePath: string
  private credentials: StoredCredentials = {}

  constructor() {
    const userDataPath = app.getPath('userData')
    const storeDir = join(userDataPath, 'secure-store')
    if (!existsSync(storeDir)) {
      mkdirSync(storeDir, { recursive: true })
    }
    this.filePath = join(storeDir, 'credentials.enc')
    this.load()
  }

  private load(): void {
    if (!existsSync(this.filePath)) return
    try {
      const encrypted = readFileSync(this.filePath)
      if (!safeStorage.isEncryptionAvailable()) {
        const decrypted = encrypted.toString('utf8')
        this.credentials = JSON.parse(decrypted)
        return
      }
      const decrypted = safeStorage.decryptString(encrypted)
      this.credentials = JSON.parse(decrypted)
    } catch {
      this.credentials = {}
    }
  }

  private save(): void {
    const serialized = JSON.stringify(this.credentials)
    try {
      if (safeStorage.isEncryptionAvailable()) {
        const encrypted = safeStorage.encryptString(serialized)
        writeFileSync(this.filePath, encrypted)
      } else {
        writeFileSync(this.filePath, Buffer.from(serialized, 'utf8'))
      }
    } catch {
      writeFileSync(this.filePath, Buffer.from(serialized, 'utf8'))
    }
  }

  get(accountId: string): { accessToken: string; refreshToken?: string; expiresAt?: number } | null {
    return this.credentials[accountId] ?? null
  }

  set(
    accountId: string,
    tokens: { accessToken: string; refreshToken?: string; expiresAt?: number }
  ): void {
    this.credentials[accountId] = tokens
    this.save()
  }

  delete(accountId: string): void {
    delete this.credentials[accountId]
    this.save()
  }

  has(accountId: string): boolean {
    return accountId in this.credentials
  }

  list(): string[] {
    return Object.keys(this.credentials)
  }
}

export const credentialStore = new CredentialStore()
