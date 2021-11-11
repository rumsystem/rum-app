import React from 'react';
import { ipcRenderer } from 'electron';
import useDatabase from 'hooks/useDatabase';
import Database from 'hooks/useDatabase/database';
import useOffChainDatabase from 'hooks/useOffChainDatabase';
import type OffChainDatabase from 'hooks/useOffChainDatabase/database';
import * as offChainDatabaseExportImport from 'hooks/useOffChainDatabase/exportImport';
import sleep from 'utils/sleep';
import { Store, useStore } from 'store';

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
    ipcRenderer.on('clean-local-data', () => {
      cleanLocalData(options);
    });
  }, []);
};

function cleanLocalData(options: IOptions) {
  const { nodeStore, confirmDialogStore } = options.store;
  confirmDialogStore.show({
    content: '确定清除客户端的缓存数据吗？',
    okText: '确定',
    isDangerous: true,
    ok: async () => {
      options.database.delete();
      await offChainDatabaseExportImport.remove(
        options.offChainDatabase,
        nodeStore.storagePath,
      );
      await sleep(300);
      window.location.reload();
    },
  });
}
