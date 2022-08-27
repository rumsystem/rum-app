import React from 'react';
import { ipcRenderer } from 'electron';
import useDatabase from 'hooks/useDatabase';
import Database from 'hooks/useDatabase/database';
import useOffChainDatabase from 'hooks/useOffChainDatabase';
import type OffChainDatabase from 'hooks/useOffChainDatabase/database';
import * as offChainDatabaseExportImport from 'hooks/useOffChainDatabase/exportImport';
import sleep from 'utils/sleep';
import { Store, useStore } from 'store';
import { lang } from 'utils/lang';
import ElectronNodeStore from 'store/electronNodeStore';
import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';
import electronApiConfigHistoryStore from 'store/electronApiConfigHistoryStore';

interface IOptions {
  store: Store
  database: Database
  offChainDatabase: OffChainDatabase
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

  React.useEffect(() => {
    const clear = () => {
      cleanLocalData(options);
    };
    ipcRenderer.on('clean-local-data', clear);
    return () => {
      ipcRenderer.off('clean-local-data', clear);
    };
  }, []);
};

function cleanLocalData(options: IOptions) {
  const { nodeStore, confirmDialogStore } = options.store;
  confirmDialogStore.show({
    content: lang.confirmToClearCacheData,
    okText: lang.yes,
    isDangerous: true,
    ok: async () => {
      options.database.delete();
      await offChainDatabaseExportImport.remove(
        options.offChainDatabase,
        nodeStore.storagePath,
      );
      ElectronCurrentNodeStore.getStore().clear();
      ElectronNodeStore.getStore().clear();
      electronApiConfigHistoryStore.getStore().clear();
      await sleep(300);
      window.location.reload();
    },
  });
}
