import React from 'react';
import { useStore } from 'store';
import Database from 'store/database';
import * as Quorum from 'utils/quorum';
import { sleep } from 'utils';

export default () => {
  const { groupStore, nodeStore, confirmDialogStore } = useStore();

  return React.useCallback(() => {
    confirmDialogStore.show({
      content: '重置之后，所有群组和消息将全部丢失，请谨慎操作',
      okText: '确定重置',
      isDangerous: true,
      ok: async () => {
        const { storagePath } = nodeStore;
        groupStore.resetElectronStore();
        nodeStore.resetElectronStore();
        new Database().delete();
        nodeStore.setStoragePath(storagePath);
        confirmDialogStore.setLoading(true);
        await Quorum.down();
        await nodeStore.resetStorage();
        confirmDialogStore.hide();
        await sleep(300);
        window.location.reload();
      },
    });
  }, []);
};
