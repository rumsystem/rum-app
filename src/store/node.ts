import { INodeInfo } from 'apis/node';
import { INetwork, INetworkGroup } from 'apis/network';
import { ProcessStatus } from 'utils/quorum';
import Store from 'electron-store';
import { isProduction, isStaging } from 'utils/env';
import { v4 as uuidV4 } from 'uuid';

type Mode = 'INTERNAL' | 'EXTERNAL' | '';

export interface IApiConfig {
  host: string
  port: string
  jwt: string
  cert: string
}

interface IApiConfigHistoryItem extends IApiConfig {
  id: string
}

const ELECTRON_NODE_STORE_NAME = (isProduction ? `${isStaging ? 'staging_' : ''}node` : 'dev_node') + '_v1';
const ELECTRON_API_CONFIG_HISTORY_STORE_NAME = (isProduction ? `${isStaging ? 'staging_' : ''}api_config_history` : 'dev_api_config_history') + '_v1';

const nodeStore = new Store({
  name: ELECTRON_NODE_STORE_NAME,
});

const apiConfigHistoryStore = new Store({
  name: ELECTRON_API_CONFIG_HISTORY_STORE_NAME,
});

export function createNodeStore() {
  return {
    connected: false,

    quitting: false,

    apiConfig: (nodeStore.get('apiConfig') || {}) as IApiConfig,

    apiConfigHistory: (apiConfigHistoryStore.get('apiConfigHistory') || []) as IApiConfigHistoryItem[],

    password: '' as string,

    status: <ProcessStatus>{},

    info: {} as INodeInfo,

    network: {} as INetwork,

    storagePath: (nodeStore.get('storagePath') || '') as string,

    mode: (nodeStore.get('mode') || '') as Mode,

    electronStoreName: ELECTRON_NODE_STORE_NAME,

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
      nodeStore.set('apiConfig', apiConfig);
    },

    setPassword(value: string) {
      this.password = value;
    },

    resetElectronStore() {
      if (!nodeStore) {
        return;
      }
      nodeStore.clear();
    },

    setMode(mode: Mode) {
      this.mode = mode;
      nodeStore.set('mode', mode);
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
      nodeStore.set('storagePath', path);
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
      localStorage.clear();
    },

    addApiConfigHistory(apiConfig: IApiConfig) {
      const exist = this.apiConfigHistory.find((a) =>
        a.host === apiConfig.host
        && a.port === apiConfig.port);
      if (exist) {
        return;
      }
      this.apiConfigHistory.push({
        id: uuidV4(),
        ...apiConfig,
      });
      apiConfigHistoryStore.set('apiConfigHistory', this.apiConfigHistory);
    },

    updateApiConfigHistory(apiConfig: IApiConfig) {
      this.apiConfigHistory = this.apiConfigHistory.map((_a) => {
        if (_a.host === apiConfig.host && _a.port === apiConfig.port) {
          return {
            ..._a,
            ...apiConfig,
          };
        }
        return _a;
      });
      apiConfigHistoryStore.set('apiConfigHistory', this.apiConfigHistory);
    },

    removeApiConfigHistory(id: string) {
      this.apiConfigHistory = this.apiConfigHistory.filter((apiConfig) => apiConfig.id !== id);
      apiConfigHistoryStore.set('apiConfigHistory', this.apiConfigHistory);
    },
  };
}
