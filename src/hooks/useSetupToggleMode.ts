import React from 'react';
import * as Quorum from 'utils/quorum';
import { ipcRenderer } from 'electron';
import { Store, useStore } from 'store';
import sleep from 'utils/sleep';

export default () => {
  const store = useStore();

  React.useEffect(() => {
    ipcRenderer.on('toggle-mode', () => {
      toggleMode(store);
    });
  }, []);
};

async function toggleMode(store: Store) {
  store.modalStore.pageLoading.show();
  store.nodeStore.setQuitting(true);
  store.nodeStore.resetElectronStore();
  await sleep(500);
  if (store.nodeStore.mode === 'EXTERNAL') {
    store.nodeStore.setMode('INTERNAL');
  } else {
    store.nodeStore.setMode('EXTERNAL');
  }
  if (store.nodeStore.status.up) {
    await Quorum.down();
  }
  window.location.reload();
}
