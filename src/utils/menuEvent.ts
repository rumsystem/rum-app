import { ipcRenderer } from 'electron';
import { sleep } from 'utils';
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
  (window as any).store.groupStore.reset();
  (window as any).store.nodeStore.resetPort();
  (window as any).store.nodeStore.resetApiHost();
  (window as any).store.nodeStore.setMode('');
  Quorum.down();
  await sleep(200);
  window.location.reload();
}
