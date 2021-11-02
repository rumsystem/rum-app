import { remote, ipcRenderer } from 'electron';
import fs from 'fs';
import util from 'util';
import * as Quorum from 'utils/quorum';

const pWriteFile = util.promisify(fs.writeFile);

const toJSONString = (args: any) => {
  return args.map((arg: any) => {
    if (typeof arg === 'object') {
      return JSON.stringify(arg);
    }
    return arg;
  });
};

const setup = () => {
  try {
    (console as any).logs = [];
    (console as any).defaultLog = console.log.bind(console);
    console.log = function () {
      try {
        (console as any).logs.push(toJSONString(Array.from(arguments)));
      } catch (err) {}
      (console as any).defaultLog.apply(console, arguments);
    };
    (console as any).defaultError = console.error.bind(console);
    console.error = function () {
      try {
        (console as any).logs.push(Array.from(arguments));
      } catch (err) {}
      (console as any).defaultError.apply(console, arguments);
    };
    window.onerror = function (error) {
      (console as any).logs.push(error);
    };
    ipcRenderer.on('export-logs', exportLogs);

    if (process.env.NODE_ENV !== 'development') {
      console.log(window.navigator.userAgent);
    }
  } catch (err) {
    console.log(err.message);
  }
};

const trySaveGroupLog = async () => {
  if ((window as any).store.groupStore.quorumStatus === 'UP') {
    const res = await Quorum.up((window as any).store.groupStore.nodeConfig);
    console.log({
      currentPort: (window as any).store.groupStore.nodePort,
      ...res,
    });
  }
};

const exportLogs = async () => {
  try {
    await trySaveGroupLog();
    const file = await remote.dialog.showSaveDialog({
      defaultPath: 'logs.txt',
    });
    if (!file.canceled && file.filePath) {
      await pWriteFile(
        file.filePath.toString(),
        ((console as any).logs || []).join('\n\r')
      );
    }
  } catch (err) {
    console.log(err.message);
  }
};

export default {
  setup,
};
