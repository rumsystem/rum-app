import { isProduction, isStaging } from 'utils/env';
import Store from 'electron-store';

const ELECTRON_NODE_STORE_NAME = (isProduction ? `${isStaging ? 'staging_' : ''}node` : 'dev_node') + '_v1';

export default {
  store: new Store({
    name: ELECTRON_NODE_STORE_NAME,
  }),

  getStore() {
    return this.store;
  },
};
