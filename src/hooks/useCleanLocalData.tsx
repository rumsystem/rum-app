import React from 'react';
import useDatabase from 'hooks/useDatabase';
import useOffChainDatabase from 'hooks/useOffChainDatabase';
import * as offChainDatabaseExportImport from 'hooks/useOffChainDatabase/exportImport';
import sleep from 'utils/sleep';
import { lang } from 'utils/lang';
import { useStore } from 'store';
import ElectronNodeStore from 'store/electronNodeStore';
import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';
import electronApiConfigHistoryStore from 'store/electronApiConfigHistoryStore';

export default () => {
  const { nodeStore, confirmDialogStore } = useStore();
  const database = useDatabase();
  const offChainDatabase = useOffChainDatabase();

  return React.useCallback(() => {
    confirmDialogStore.show({
      content: lang.confirmToClearCacheData,
      okText: lang.yes,
      isDangerous: true,
      ok: async () => {
        database.delete();
        await offChainDatabaseExportImport.remove(
          offChainDatabase,
          nodeStore.storagePath,
        );

        ElectronCurrentNodeStore.getStore()?.clear();
        ElectronNodeStore.getStore()?.clear();
        electronApiConfigHistoryStore.getStore()?.clear();

        await sleep(300);
        window.location.reload();
      },
    });
  }, []);
};
