import React from 'react';
import * as Quorum from 'utils/quorum';
import { ipcRenderer } from 'electron';
import externalNodeMode from 'utils/storages/externalNodeMode';
import { Store, useStore } from 'store';

export default () => {
  const store = useStore();

  React.useEffect(() => {
    ipcRenderer.on('toggle-enabled-external-node-mode', () => {
      toggleEnabledExternalNodeMode(store);
    });
  }, []);
};

async function toggleEnabledExternalNodeMode(store: Store) {
  if (externalNodeMode.enabled()) {
    externalNodeMode.disable();
  } else {
    externalNodeMode.enable();
  }
  store.modalStore.pageLoading.show();
  store.nodeStore.setQuitting(true);
  store.nodeStore.resetElectronStore();
  if (store.nodeStore.status.up) {
    await Quorum.down();
  }
  window.location.reload();
}
