import { INodeInfo } from 'apis/node';
import { INetwork, INetworkGroup } from 'apis/network';
import { ProcessStatus } from 'utils/quorum';
import Store from 'electron-store';
import { isProduction, isStaging } from 'utils/env';

type Mode = 'INTERNAL' | 'EXTERNAL' | '';

export interface IApiConfig {
  host: string
  port: string
  jwt: string
  cert: string
}

const ELECTRON_STORE_NAME = (isProduction ? `${isStaging ? 'staging_' : ''}node` : 'dev_node') + '_v1';

const store = new Store({
  name: ELECTRON_STORE_NAME,
});

export function createNodeStore() {
  return {
    connected: false,

    quitting: false,

    apiConfig: (store.get('apiConfig') || {}) as IApiConfig,

    password: '' as string,

    status: <ProcessStatus>{},

    info: {} as INodeInfo,

    network: {} as INetwork,

    storagePath: (store.get('storagePath') || '') as string,

    mode: (store.get('mode') || '') as Mode,

    electronStoreName: ELECTRON_STORE_NAME,

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
      store.set('apiConfig', apiConfig);
    },

    setPassword(value: string) {
      this.password = value;
    },

    resetElectronStore() {
      if (!store) {
        return;
      }
      store.clear();
    },

    setMode(mode: Mode) {
      this.mode = mode;
      store.set('mode', mode);
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
      store.set('storagePath', path);
    },

    setQuitting(value: boolean) {
      this.quitting = value;
    },

    resetNode() {
      this.setStoragePath('');
      this.setMode('');
      this.setApiConfig({} as IApiConfig);
      this.setPassword('');
      this.resetElectronStore();
    },
  };
}
