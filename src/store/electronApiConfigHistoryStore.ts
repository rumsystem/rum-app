import { isProduction, isStaging } from 'utils/env';
import Store from 'electron-store';

const ELECTRON_API_CONFIG_HISTORY_STORE_NAME = (isProduction ? `${isStaging ? 'staging_' : ''}api_config_history` : 'dev_api_config_history') + '_v1';

export default {
  store: process.env.IS_ELECTRON
    ? new Store({
      name: ELECTRON_API_CONFIG_HISTORY_STORE_NAME,
    })
    : null,

  getStore() {
    return this.store;
  },
};
