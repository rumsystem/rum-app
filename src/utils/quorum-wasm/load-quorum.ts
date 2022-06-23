import { action, observable, when } from 'mobx';

const wasmworker = !process.env.IS_ELECTRON
  ? new Worker(new URL('./worker.ts', import.meta.url))
  : null;
const methodCache = new Map<string, any>();

const state = observable({
  id: 1,
  inited: false,
  resolveMap: new Map<number, {
    resolve: (data: unknown) => unknown
    reject: (err: unknown) => unknown
  }>(),
});

export const quorumInited = when(() => state.inited === true);

if (wasmworker) {
  wasmworker.addEventListener('message', action((e) => {
    if (e.data === 'inited') {
      state.inited = true;
    }
    const data = e.data;
    const requestId: number = data.id;
    if (!requestId) {
      return;
    }
    const p = state.resolveMap.get(requestId);
    state.resolveMap.delete(requestId);
    if (!p) {
      return;
    }
    if ('data' in data) {
      p.resolve(data.data);
    }
    if ('error' in data) {
      p.reject(data.data);
    }
  }));
}

const call = action((method: string, args: Array<any>) => {
  const requestId = state.id;
  state.id += 1;
  const p = new Promise((resolve, reject) => {
    const item = { resolve, reject };
    state.resolveMap.set(requestId, item);
  });
  if (wasmworker) {
    wasmworker.postMessage({
      method,
      args,
      id: requestId,
    });
  }
  return p;
});

interface QWASM {
  StartQuorum: (...p: Array<any>) => Promise<any>
  StopQuorum: (...p: Array<any>) => Promise<any>
  StartSync: (...p: Array<any>) => Promise<any>
  Announce: (...p: Array<any>) => Promise<any>
  GetGroupProducers: (...p: Array<any>) => Promise<any>
  GetGroupSeed: (...p: Array<any>) => Promise<any>
  GetAnnouncedGroupProducers: (...p: Array<any>) => Promise<any>
  GroupProducer: (...p: Array<any>) => Promise<any>
  CreateGroup: (...p: Array<any>) => Promise<any>
  MgrAppConfig: (...p: Array<any>) => Promise<any>
  MgrChainConfig: (...p: Array<any>) => Promise<any>
  GetChainTrxAllowList: (...p: Array<any>) => Promise<any>
  GetChainTrxDenyList: (...p: Array<any>) => Promise<any>
  GetChainTrxAuthMode: (...p: Array<any>) => Promise<any>
  GetAppConfigKeyList: (...p: Array<any>) => Promise<any>
  GetAppConfigItem: (...p: Array<any>) => Promise<any>
  UpdateProfile: (...p: Array<any>) => Promise<any>
  GetTrx: (...p: Array<any>) => Promise<any>
  PostToGroup: (...p: Array<any>) => Promise<any>
  GetNodeInfo: (...p: Array<any>) => Promise<any>
  GetNetwork: (...p: Array<any>) => Promise<any>
  GetContent: (...p: Array<any>) => Promise<any>
  JoinGroup: (...p: Array<any>) => Promise<any>
  LeaveGroup: (...p: Array<any>) => Promise<any>
  ClearGroupData: (...p: Array<any>) => Promise<any>
  GetGroups: (...p: Array<any>) => Promise<any>
  GetKeystoreBackupReadableStream: (...p: Array<any>) => Promise<any>
  KeystoreBackupRaw: (...p: Array<any>) => Promise<any>
  KeystoreRestoreRaw: (...p: Array<any>) => Promise<any>
  IsQuorumRunning: (...p: Array<any>) => Promise<any>
}

export const qwasm = new Proxy({}, {
  get: (_target, p) => {
    const methodName = p as string;
    if (methodCache.has(methodName)) {
      return methodCache.get(methodName);
    }
    const method = (...args: Array<any>) => call(methodName, args);
    methodCache.set(methodName, method);
    return method;
  },
}) as QWASM;

export const startQuorum = async (bootstraps: Array<string>) => {
  await qwasm.StartQuorum(
    'password',
    bootstraps.join(','),
  );
};
