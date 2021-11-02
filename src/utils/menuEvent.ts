import { ipcRenderer } from 'electron';
import * as Quorum from 'utils/quorum';
import externalNodeMode from './storages/externalNodeMode';
import Log from './log';
import Database from 'store/database';
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
  const { groupStore } = (window as any).store;
  groupStore.resetElectronStore();
  new Database().delete();
  await sleep(300);
  window.location.reload();
}
