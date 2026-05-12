/// <reference types="vite/client" />

interface Window {
  api: {
    invoke: <C extends import('../../ipc/channels').IpcChannel>(
      channel: C,
      ...args: import('../../ipc/channels').IpcRequest<C> extends void ? [] : [import('../../ipc/channels').IpcRequest<C>]
    ) => Promise<import('../../ipc/channels').IpcResponse<C>>
  }
}
