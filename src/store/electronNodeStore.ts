import { isProduction, isStaging } from 'utils/env';
import Store from 'electron-store';

const ELECTRON_NODE_STORE_NAME = (isProduction ? `${isStaging ? 'staging_' : ''}node` : 'dev_node') + '_v1';

export default {
  store: process.env.IS_ELECTRON
    ? new Store({
      name: ELECTRON_NODE_STORE_NAME,
    })
    : null,

  getStore() {
    return this.store;
  },
};
