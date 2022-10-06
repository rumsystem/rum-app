import React from 'react';
import { useStore } from 'store';
import useOffChainDatabase from 'hooks/useOffChainDatabase';
import * as offChainDatabaseExportImport from 'hooks/useOffChainDatabase/exportImport';
import * as Quorum from 'utils/quorum';
import { sleep } from 'utils';
import useDatabase from 'hooks/useDatabase';

export default () => {
  const { groupStore, nodeStore, confirmDialogStore, seedStore } = useStore();
  const database = useDatabase();
  const offChainDatabase = useOffChainDatabase();

  return React.useCallback(() => {
    confirmDialogStore.show({
      content: '重置之后，所有群组和消息将全部丢失，请谨慎操作',
      okText: '确定重置',
      isDangerous: true,
      ok: async () => {
        const { storagePath } = nodeStore;
        nodeStore.setQuitting(true);
        groupStore.resetElectronStore();
        nodeStore.resetElectronStore();
        database.delete();
        await offChainDatabaseExportImport.remove(
          offChainDatabase,
          storagePath
        );
        nodeStore.setStoragePath(storagePath);
        confirmDialogStore.setLoading(true);
        await Quorum.down();
        await nodeStore.resetStorage();
        await seedStore.remove(storagePath);
        confirmDialogStore.hide();
        await sleep(300);
        window.location.reload();
      },
    });
  }, []);
};
