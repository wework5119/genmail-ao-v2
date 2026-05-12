import type { IpcChannel, IpcRequest, IpcResponse } from '../ipc/channels'

interface WindowWithApi {
  api: {
    invoke: <C extends IpcChannel>(
      channel: C,
      ...args: IpcRequest<C> extends void ? [] : [IpcRequest<C>]
    ) => Promise<IpcResponse<C>>
  }
}

declare global {
  interface Window {
    api: WindowWithApi['api']
  }
}

export function invoke<C extends IpcChannel>(
  channel: C,
  ...args: IpcRequest<C> extends void ? [] : [IpcRequest<C>]
): Promise<IpcResponse<C>> {
  return window.api.invoke(channel, ...(args as IpcRequest<C> extends void ? [] : [IpcRequest<C>]))
}
