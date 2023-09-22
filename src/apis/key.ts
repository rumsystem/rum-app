import { qwasm } from 'utils/quorum-wasm/load-quorum';

export interface BackupData {
  config: string
  keystore: string
  seeds: string
}

export default {
  restoreKeyBrowser(key: string) {
    if (!process.env.IS_ELECTRON) {
      return qwasm.KeystoreRestoreRaw('password', key);
    }
    return null;
  },
};
