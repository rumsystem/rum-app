import { ipcRenderer } from 'electron';
import * as Quorum from 'utils/quorum';
import externalNodeMode from './storages/externalNodeMode';
import Log from './log';
import Database from 'store/database';
import * as OffChainDatabase from 'store/offChainDatabase';
import { sleep } from 'utils';

export function initMenuEventListener() {
  ipcRenderer.on(
    'toggle-enabled-external-node-mode',
    toggleEnabledExternalNodeMode
  );
  ipcRenderer.on('export-logs', Log.exportLogs);
  ipcRenderer.on('clean-local-data', cleanLocalData);
}

async function toggleEnabledExternalNodeMode() {
  const { store } = window as any;
  externalNodeMode.enabled()
    ? externalNodeMode.disable()
    : externalNodeMode.enable();
  store.modalStore.pageLoading.show();
  store.groupStore.resetElectronStore();
  store.nodeStore.resetElectronStore();
  if (store.nodeStore.status.up) {
    await Quorum.down();
  }
  window.location.reload();
}

async function cleanLocalData() {
  const { groupStore, nodeStore } = (window as any).store;
  groupStore.resetElectronStore();
  new Database().delete();
  await OffChainDatabase.remove(nodeStore.storagePath);
  await sleep(300);
  window.location.reload();
}
