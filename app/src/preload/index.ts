import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../ipc/channels'
import type { IpcChannel, IpcRequest, IpcResponse } from '../ipc/channels'

const validChannels = new Set(Object.values(IPC_CHANNELS))

const api = {
  invoke: <C extends IpcChannel>(
    channel: C,
    ...args: IpcRequest<C> extends void ? [] : [IpcRequest<C>]
  ): Promise<IpcResponse<C>> => {
    if (!validChannels.has(channel)) {
      throw new Error(`Unknown IPC channel: ${channel}`)
    }
    return ipcRenderer.invoke(channel, ...(args as [unknown])) as Promise<IpcResponse<C>>
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronApi = typeof api
