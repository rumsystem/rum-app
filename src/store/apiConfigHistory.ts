import { v4 as uuidV4 } from 'uuid';
import ElectronApiConfigHistoryStore from 'store/electronApiConfigHistoryStore';

export interface IApiConfig {
  host: string
  port: string
  jwt: string
}

const store = ElectronApiConfigHistoryStore.getStore();

export interface IApiConfigHistoryItem extends IApiConfig {
  id: string
}

export function createApiConfigHistoryStore() {
  return {
    apiConfigHistory: (store?.get('apiConfigHistory') || []) as IApiConfigHistoryItem[],

    add(apiConfig: IApiConfig) {
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
      store?.set('apiConfigHistory', this.apiConfigHistory);
    },

    update(apiConfig: IApiConfig) {
      this.apiConfigHistory = this.apiConfigHistory.map((_a) => {
        if (_a.host === apiConfig.host && _a.port === apiConfig.port) {
          return {
            ..._a,
            ...apiConfig,
          };
        }
        return _a;
      });
      store?.set('apiConfigHistory', this.apiConfigHistory);
    },

    remove(id: string) {
      this.apiConfigHistory = this.apiConfigHistory.filter((apiConfig) => apiConfig.id !== id);
      store?.set('apiConfigHistory', this.apiConfigHistory);
    },
  };
}
