import React from 'react';
import { ipcRenderer } from 'electron';
import { useStore } from 'store';
import sleep from 'utils/sleep';
import useExitNode from 'hooks/useExitNode';

export default () => {
  const store = useStore();
  const exitNode = useExitNode();

  React.useEffect(() => {
    ipcRenderer.on('toggle-mode', async () => {
      store.modalStore.pageLoading.show();
      store.nodeStore.setQuitting(true);
      store.nodeStore.resetElectronStore();
      await sleep(500);
      if (store.nodeStore.mode === 'EXTERNAL') {
        store.nodeStore.setMode('INTERNAL');
      } else {
        store.nodeStore.setMode('EXTERNAL');
      }
      await exitNode();
      window.location.reload();
    });
  }, []);
};
