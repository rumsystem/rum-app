import { ipcRenderer } from 'electron';
import { dialog, app } from '@electron/remote';
import fs from 'fs-extra';
import * as Quorum from 'utils/quorum';
import { pick } from 'lodash';

const exportLogs = async () => {
  saveNodeStoreData();
  await saveElectronStore();
  await saveQuorumLog();
  await saveMainLogs();
  try {
    const file = await dialog.showSaveDialog({
      defaultPath: 'logs.txt',
    });
    if (!file.canceled && file.filePath) {
      await fs.writeFile(
        file.filePath.toString(),
        ((console as any).logs || []).join('\n\r'),
      );
    }
  } catch (err) {
    console.error(err);
  }
};

const toJSONString = (args: any) => args.map((arg: any) => {
  if (typeof arg === 'object') {
    return JSON.stringify(arg);
  }
  return arg;
});

const setup = () => {
  try {
    (console as any).logs = [];
    (console as any).defaultLog = console.log.bind(console);
    console.log = function log(...args: Array<any>) {
      try {
        (console as any).logs.push(toJSONString(Array.from(args)));
      } catch (err) {}
      if (process.env.NODE_ENV === 'development') {
        const stack = new Error().stack!;
        const location = /at console.log.*\n.*?\((.*)\)/.exec(stack)![1].trim();
        if (location.includes('node_modules')) {
          (console as any).defaultLog.apply(console, args);
        } else {
          (console as any).defaultLog.apply(console, [`${location}\n`, ...args]);
        }
      } else {
        (console as any).defaultLog.apply(console, args);
      }
    };
    (console as any).defaultError = console.error.bind(console);
    console.error = function error(...args: Array<any>) {
      try {
        (console as any).logs.push(Array.from(args)[0].message);
        (console as any).logs.push(Array.from(args));
      } catch (err) {}
      (console as any).defaultError.apply(console, args);
    };
    window.onerror = function onerror(error) {
      (console as any).logs.push(error);
    };

    if (process.env.NODE_ENV !== 'development') {
      console.log(window.navigator.userAgent);
    }

    ipcRenderer.on('export-logs', exportLogs);
  } catch (err) {
    console.error(err);
  }
};

const saveQuorumLog = async () => {
  try {
    console.log('=================== Quorum Logs ==========================');
    const { data: status } = await Quorum.getLogs();
    const logs = status.logs;
    status.logs = '';
    console.log(status);
    for (const log of (logs || '').split(/[\n]/)) {
      console.log(log);
    }
  } catch (err) {}
};

const saveElectronStore = async () => {
  const appPath = app.getPath('userData');
  const path = `${appPath}/${
    (window as any).store.nodeStore.electronStoreName
  }.json`;
  const electronStore = await fs.readFile(path, 'utf8');
  console.log(
    '================== node ElectronStore Logs ======================',
  );
  console.log(path);
  console.log(electronStore);
};

const saveNodeStoreData = () => {
  console.log(
    '================== node Store Logs ======================',
  );
  const { nodeStore } = (window as any).store;
  console.log(pick(nodeStore, [
    'apiHost',
    'port',
    'info',
    'storagePath',
    'mode',
    'canUseExternalMode',
    'network',
  ]));
};

const saveMainLogs = async () => {
  ipcRenderer.send('get_main_log');

  const mainLogs = await new Promise((rs) => {
    ipcRenderer.once('response_main_log', (_event, args) => {
      rs(args.data);
    });
  });

  console.log('=================== Main Process Logs ==========================');
  console.log(mainLogs);
};

export default {
  setup,
  exportLogs,
};
