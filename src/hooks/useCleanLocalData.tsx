import React from 'react';
import useDatabase from 'hooks/useDatabase';
import sleep from 'utils/sleep';
import { lang } from 'utils/lang';
import { useStore } from 'store';
import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';
import electronApiConfigHistoryStore from 'store/electronApiConfigHistoryStore';

export default () => {
  const { confirmDialogStore, nodeStore } = useStore();
  const database = useDatabase();

  return React.useCallback(() => {
    confirmDialogStore.show({
      content: lang.confirmToClearCacheData,
      okText: lang.yes,
      isDangerous: true,
      ok: async () => {
        confirmDialogStore.setLoading(true);

        await sleep(300);

        nodeStore.setQuitting(true);
        nodeStore.setConnected(false);

        ElectronCurrentNodeStore.getStore().clear();
        electronApiConfigHistoryStore.getStore()?.clear();

        database.delete();

        await sleep(300);
        window.location.reload();
      },
    });
  }, []);
};
