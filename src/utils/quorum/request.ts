import { ipcRenderer } from 'electron';

let id = 0;

const callbackQueueMap = new Map<number, (v: unknown) => unknown>();

export interface QuorumIPCRequest {
  action: string
  param?: any
  id: number
}

export interface QuorumIPCResult<T extends unknown> {
  id: number
  data: T
  err: string | null
}

export const sendRequest = <T extends unknown>(
  param: Pick<QuorumIPCRequest, Exclude<keyof QuorumIPCRequest, 'id'>>,
) => {
  id += 1;
  const requestId = id;
  let resolve: (v: unknown) => unknown = () => {};
  const promise = new Promise<unknown>((rs) => {
    resolve = rs;
  });
  callbackQueueMap.set(requestId, resolve);
  const data: QuorumIPCRequest = {
    ...param,
    id: requestId,
  };
  ipcRenderer.send('quorum', data);
  return promise as Promise<QuorumIPCResult<T>>;
};

export const initQuorum = () => {
  ipcRenderer.on('quorum', (_event, args) => {
    const id = args.id;
    if (!id) {
      return;
    }

    const callback = callbackQueueMap.get(id);
    if (!callback) {
      return;
    }

    callback(args);
    callbackQueueMap.delete(id);
  });
};
