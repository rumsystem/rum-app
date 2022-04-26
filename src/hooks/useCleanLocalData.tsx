import React from 'react';
import useDatabase from 'hooks/useDatabase';
import sleep from 'utils/sleep';
import { lang } from 'utils/lang';
import { useStore } from 'store';
import ElectronNodeStore from 'store/electronNodeStore';
import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';
import electronApiConfigHistoryStore from 'store/electronApiConfigHistoryStore';

export default () => {
  const { confirmDialogStore } = useStore();
  const database = useDatabase();

  return React.useCallback(() => {
    confirmDialogStore.show({
      content: lang.confirmToClearCacheData,
      okText: lang.yes,
      isDangerous: true,
      ok: async () => {
        database.delete();

        ElectronCurrentNodeStore.getStore().clear();
        ElectronNodeStore.getStore()?.clear();
        electronApiConfigHistoryStore.getStore()?.clear();

        await sleep(300);
        window.location.reload();
      },
    });
  }, []);
};
