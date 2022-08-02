import { v4 as uuidV4 } from 'uuid';
import ElectronApiConfigHistoryStore from 'store/electronApiConfigHistoryStore';

export interface IApiConfig {
  origin: string
  jwt: string
}

const store = ElectronApiConfigHistoryStore.getStore();

export interface IApiConfigHistoryItem extends IApiConfig {
  id: string
}

export function createApiConfigHistoryStore() {
  const apiConfigHistoryKey = 'apiConfigHistoryV2';

  return {
    apiConfigHistory: (store?.get(apiConfigHistoryKey) || []) as IApiConfigHistoryItem[],

    add(apiConfig: IApiConfig) {
      const exist = this.apiConfigHistory.find((a) => a.origin === apiConfig.origin);
      if (exist) {
        return;
      }
      this.apiConfigHistory.push({
        id: uuidV4(),
        ...apiConfig,
      });
      store?.set(apiConfigHistoryKey, this.apiConfigHistory);
    },

    update(apiConfig: IApiConfig) {
      this.apiConfigHistory = this.apiConfigHistory.map((_a) => {
        if (_a.origin === apiConfig.origin) {
          return {
            ..._a,
            ...apiConfig,
          };
        }
        return _a;
      });
      store?.set(apiConfigHistoryKey, this.apiConfigHistory);
    },

    remove(id: string) {
      this.apiConfigHistory = this.apiConfigHistory.filter((apiConfig) => apiConfig.id !== id);
      store?.set(apiConfigHistoryKey, this.apiConfigHistory);
    },
  };
}
