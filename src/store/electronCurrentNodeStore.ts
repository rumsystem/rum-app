import { isProduction, isStaging } from 'utils/env';
import Store from 'electron-store';
import crypto from 'crypto';

const ELECTRON_STORE_NAME_PREFIX = isProduction ? `${isStaging ? 'staging_' : ''}` : 'dev_';

export default {
  store: {} as Store,

  getStore() {
    return this.store;
  },

  init(nodePublickey: string) {
    this.store = new Store({
      name: ELECTRON_STORE_NAME_PREFIX + crypto.createHash('md5').update(nodePublickey).digest('hex'),
    });
  },
};
