import { Go } from './wasm_exec';
import quorumWasmUrl from 'quorum_bin/lib.wasm';

declare global {
  function StartQuorum(...p: Array<any>): Promise<any>;
  function StopQuorum(...p: Array<any>): Promise<any>;
  function StartSync(...p: Array<any>): Promise<any>;
  function Announce(...p: Array<any>): Promise<any>;
  function GetGroupProducers(...p: Array<any>): Promise<any>;
  function GetAnnouncedGroupProducers(...p: Array<any>): Promise<any>;
  function GroupProducer(...p: Array<any>): Promise<any>;
  function CreateGroup(...p: Array<any>): Promise<any>;
  function MgrGrpBlkList(...p: Array<any>): Promise<any>;
  function GetDeniedUserList(...p: Array<any>): Promise<any>;
  function UpdateProfile(...p: Array<any>): Promise<any>;
  function GetTrx(...p: Array<any>): Promise<any>;
  function PostToGroup(...p: Array<any>): Promise<any>;
  function GetNodeInfo(...p: Array<any>): Promise<any>;
  function GetNetwork(...p: Array<any>): Promise<any>;
  function GetContent(...p: Array<any>): Promise<any>;
  function JoinGroup(...p: Array<any>): Promise<any>;
  function LeaveGroup(...p: Array<any>): Promise<any>;
  function ClearGroupData(...p: Array<any>): Promise<any>;
  function GetGroups(...p: Array<any>): Promise<any>;
  function GetKeystoreBackupReadableStream(...p: Array<any>): Promise<any>;
  function KeystoreBackupRaw(...p: Array<any>): Promise<any>;
  function KeystoreRestoreRaw(...p: Array<any>): Promise<any>;
  function IsQuorumRunning(...p: Array<any>): Promise<any>;
}


const init = async () => {
  const go = new Go();
  const r = await WebAssembly.instantiateStreaming(fetch(quorumWasmUrl), go.importObject);

  go.run(r.instance);
  globalThis.postMessage('inited');
};

const shim = {
  'KeystoreBackupRaw': async (password: string) => {
    const keys: Array<string> = [];
    await new Promise<void>((rs) => {
      globalThis.KeystoreBackupRaw(
        password,
        (k: string) => keys.push(k),
        () => {
          console.log('done');
          rs();
        },
      );
    });
    return keys;
  },
};

globalThis.addEventListener('message', async (e) => {
  try {
    const data = e.data;
    const { method, args, id } = data;
    const promise = method in shim
      ? (shim as any)[method](...args)
      : (globalThis as any)[method](...args);

    const result = await promise.then((res: any) => {
      const data = 'data' in res ? res.data : res;
      return { data };
    }, (error: any) => {
      console.error(error);
      return { error };
    });
    globalThis.postMessage({
      ...result,
      id,
    });
  } catch (e) {
    console.error(e);
  }
});

init();
