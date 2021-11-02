import { ipcRenderer } from 'electron';
import * as Quorum from 'utils/quorum';
import externalNodeMode from '../utils/storages/externalNodeMode';
import Log from '../utils/log';
import { Database } from 'hooks/useDatabase';
import useOffChainDatabase, {
  OffChainDatabase,
} from 'hooks/useOffChainDatabase';
import * as offChainDatabaseExportImport from 'hooks/useOffChainDatabase/exportImport';
import { sleep } from 'utils';
import { Store, useStore } from 'store';
import useDatabase from 'hooks/useDatabase';

interface IOptions {
  store: Store;
  database: Database;
  offChainDatabase: OffChainDatabase;
}

export default () => {
  const store = useStore();
  const database = useDatabase();
  const offChainDatabase = useOffChainDatabase();
  const options = {
    store,
    database,
    offChainDatabase,
  };
  ipcRenderer.on('toggle-enabled-external-node-mode', () => {
    toggleEnabledExternalNodeMode(options);
  });
  ipcRenderer.on('export-logs', Log.exportLogs);
  ipcRenderer.on('clean-local-data', () => {
    cleanLocalData(options);
  });
};

async function toggleEnabledExternalNodeMode(options: IOptions) {
  const { store } = options;
  externalNodeMode.enabled()
    ? externalNodeMode.disable()
    : externalNodeMode.enable();
  store.modalStore.pageLoading.show();
  store.groupStore.resetElectronStore();
  store.nodeStore.resetElectronStore();
  if (store.nodeStore.status.up) {
    await Quorum.down();
  }
  window.location.reload();
}

async function cleanLocalData(options: IOptions) {
  const { groupStore, nodeStore } = options.store;
  groupStore.resetElectronStore();
  options.database.delete();
  await offChainDatabaseExportImport.remove(
    options.offChainDatabase,
    nodeStore.storagePath
  );
  await sleep(300);
  window.location.reload();
}
