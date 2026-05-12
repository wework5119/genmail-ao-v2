import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (_) {
    /* noop */
  }
} else {
  // @ts-expect-error (window.electron used in pre-bridge setup)
  window.electron = electronAPI
  // @ts-expect-error (window.api used in pre-bridge setup)
  window.api = api
}
