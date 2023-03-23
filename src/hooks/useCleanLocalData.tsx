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
        if (confirmDialogStore.loading) {
          return;
        }

        confirmDialogStore.setLoading(true);

        if (process.env.NODE_ENV !== 'development') { await sleep(500); }

        nodeStore.setQuitting(true);
        nodeStore.setConnected(false);

        if (process.env.NODE_ENV !== 'development') { await sleep(500); }

        ElectronCurrentNodeStore.getStore().clear();
        electronApiConfigHistoryStore.getStore()?.clear();

        if (process.env.NODE_ENV !== 'development') { await sleep(500); }

        await database.delete();

        if (process.env.NODE_ENV !== 'development') { await sleep(500); }
        window.location.reload();
      },
    });
  }, [database]);
};
