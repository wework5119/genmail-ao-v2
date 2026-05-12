/// <reference types="vite/client" />

interface ElectronAPI {
  getAccounts: () => Promise<import('./types').Account[]>
  listThreads: (
    params: import('./types').ListThreadsParams
  ) => Promise<import('./types').ListThreadsResult>
}

interface Window {
  electronAPI?: ElectronAPI
}
