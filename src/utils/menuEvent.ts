import { ipcRenderer } from 'electron';
import { sleep } from 'utils';
import * as Quorum from 'utils/quorum';
import CustomPort from './storages/customPort';
import Log from './log';

export function initMenuEventListener() {
  ipcRenderer.on('toggle-enabled-custom-port', toggleEnabledCustomPort);
  ipcRenderer.on('export-logs', Log.exportLogs);
}

async function toggleEnabledCustomPort() {
  CustomPort.enabled() ? CustomPort.disable() : CustomPort.enable();
  (window as any).store.modalStore.pageLoading.show();
  (window as any).store.groupStore.reset();
  (window as any).store.nodeStore.reset();
  Quorum.down();
  await sleep(200);
  window.location.reload();
}
