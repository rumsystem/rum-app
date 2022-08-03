import { INodeInfo } from 'apis/node';
import { INetwork, INetworkGroup } from 'apis/network';
import { ProcessStatus } from 'utils/quorum';
import ElectronNodeStore from 'store/electronNodeStore';
import { IApiConfig } from './apiConfigHistory';

type Mode = 'INTERNAL' | 'EXTERNAL' | '';

const store = ElectronNodeStore.getStore();

export function createNodeStore() {
  return {
    connected: false,

    quitting: false,

    apiConfig: (store?.get('apiConfig') || {}) as IApiConfig,

    password: '' as string,

    status: <ProcessStatus>{},

    info: {} as INodeInfo,

    network: {} as INetwork,

    storagePath: (store?.get('storagePath') || '') as string,

    mode: (store?.get('mode') || '') as Mode,

    get groupNetworkMap() {
      const map = {} as Record<string, INetworkGroup>;
      for (const groupNetwork of this.network.groups || []) {
        map[groupNetwork.GroupId] = groupNetwork;
      }
      return map;
    },

    setConnected(value: boolean) {
      this.connected = value;
    },

    setStatus(ProcessStatus: ProcessStatus) {
      this.status = ProcessStatus;
    },

    setApiConfig(apiConfig: IApiConfig) {
      this.apiConfig = apiConfig;
      if (store) {
        store.set('apiConfig', apiConfig);
      }
    },

    setPassword(value: string) {
      this.password = value;
    },

    setMode(mode: Mode) {
      this.mode = mode;
      if (store) {
        store.set('mode', mode);
      }
    },

    setInfo(info: INodeInfo) {
      this.info = info;
    },

    setNetwork(network: INetwork) {
      this.network = network;
    },

    updateStatus(status: string) {
      this.info.node_status = status;
    },

    setStoragePath(path: string) {
      if (this.storagePath && path !== this.storagePath) {
        localStorage.removeItem(`p${this.storagePath}`);
      }
      this.storagePath = path;
      if (store) {
        store.set('storagePath', path);
      }
    },

    setQuitting(value: boolean) {
      this.quitting = value;
    },

    reset() {
      this.setStoragePath('');
      this.setMode('');
      this.setApiConfig({} as IApiConfig);
      this.setPassword('');
      localStorage.removeItem(`p${this.storagePath}`);
    },
  };
}
