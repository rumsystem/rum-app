import { isProduction, isStaging } from 'utils/env';
import Store from 'electron-store';
import { digestMessage } from 'utils/digestMessage';

const ELECTRON_STORE_NAME_PREFIX = isProduction ? `${isStaging ? 'staging_' : ''}` : 'dev_';

export default {
  store: null as Store | null,

  getStore() {
    if (!this.store) {
      throw new Error('store is used before inited');
    }
    return this.store;
  },

  init(nodePublickey: string) {
    const storeName = `${ELECTRON_STORE_NAME_PREFIX}${digestMessage(nodePublickey)}`;

    this.store = new Store({ name: storeName });
  },
};
