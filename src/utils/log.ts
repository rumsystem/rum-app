import { ipcRenderer } from 'electron';
import { dialog } from '@electron/remote';
import fs from 'fs-extra';
import * as Quorum from 'utils/quorum';
import { pick } from 'lodash';

import ElectronNodeStore from 'store/electronNodeStore';
import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';

const exportLogs = async () => {
  saveNodeStoreData();
  await saveElectronNodeStore();
  await saveElectronCurrentNodeStore();
  await saveMainLogs();
  await saveQuorumLog();
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
  // TODO:
  if (!process.env.IS_ELECTRON) {
    return;
  }
  try {
    (console as any).logs = [];
    (console as any).defaultLog = console.log.bind(console);
    console.log = function log(...args: Array<any>) {
      try {
        (console as any).logs.push(toJSONString(Array.from(args)));
      } catch (err) {}
      if (process.env.NODE_ENV === 'development') {
        const stack = new Error().stack!;
        const matchedStack = /at console.log.*\n.*?\((.*)\)/.exec(stack);
        const location = matchedStack ? matchedStack[1].trim() : '';
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

const saveElectronNodeStore = async () => {
  if (!process.env.IS_ELECTRON) {
    return;
  }
  const { path } = ElectronNodeStore.getStore()!;
  const data = await fs.readFile(path, 'utf8');
  console.log(
    '================== node ElectronNodeStore Logs ======================',
  );
  console.log(path);
  console.log(data);
};

const saveElectronCurrentNodeStore = async () => {
  if (!process.env.IS_ELECTRON) {
    return;
  }
  try {
    const store = ElectronCurrentNodeStore.getStore()!;
    if (store) {
      const { path } = store as any;
      const data = await fs.readFile(path, 'utf8');
      console.log(
        '================== node ElectronCurrentNodeStore Logs ======================',
      );
      console.log(path);
      console.log(data);
    }
  } catch (_err) {
    console.log(err);
  }
};

const saveNodeStoreData = () => {
  console.log(
    '================== node Store Logs ======================',
  );
  const { nodeStore } = (window as any).store;
  console.log(pick(nodeStore, [
    'apiConfig',
    'status',
    'info',
    'storagePath',
    'mode',
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
