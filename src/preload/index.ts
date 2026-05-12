import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  getAccounts: () => ipcRenderer.invoke('getAccounts'),
  listThreads: (params: {
    accountId: string
    cursor?: string
    pageSize?: number
  }) => ipcRenderer.invoke('listThreads', params)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
