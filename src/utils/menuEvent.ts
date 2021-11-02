import { ipcRenderer } from 'electron';
import * as Quorum from 'utils/quorum';
import externalNodeMode from './storages/externalNodeMode';
import Log from './log';

export function initMenuEventListener() {
  ipcRenderer.on(
    'toggle-enabled-external-node-mode',
    toggleEnabledExternalNodeMode
  );
  ipcRenderer.on('export-logs', Log.exportLogs);
}

async function toggleEnabledExternalNodeMode() {
  externalNodeMode.enabled()
    ? externalNodeMode.disable()
    : externalNodeMode.enable();
  (window as any).store.modalStore.pageLoading.show();
  (window as any).store.groupStore.resetElectronStore();
  (window as any).store.nodeStore.resetElectronStore();
  if ((window as any).store.nodeStore.status.up) {
    await Quorum.down();
  }
  window.location.reload();
}
