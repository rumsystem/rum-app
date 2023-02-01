import request from '../request';
import getBase from 'utils/getBase';
import { qwasm } from 'utils/quorum-wasm/load-quorum';

export interface BackupData {
  config: string
  keystore: string
  seeds: string
}

export default {
  backup() {
    if (!process.env.IS_ELECTRON) {
      return qwasm.KeystoreBackupRaw('password');
    }
    return request('/api/v1/backup', {
      method: 'GET',
      base: getBase(),
    }) as Promise<BackupData>;
  },
  restoreKeyBrowser(key: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.KeystoreRestoreRaw('password', key);
    }
    return null;
  },
};
