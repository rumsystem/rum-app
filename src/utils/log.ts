import { remote } from 'electron';
import fs from 'fs-extra';
import * as Quorum from 'utils/quorum';

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
        (console as any).logs.push(Array.from(arguments)[0].message);
        (console as any).logs.push(Array.from(arguments));
      } catch (err) {}
      (console as any).defaultError.apply(console, arguments);
    };
    window.onerror = function (error) {
      (console as any).logs.push(error);
    };

    if (process.env.NODE_ENV !== 'development') {
      console.log(window.navigator.userAgent);
    }
  } catch (err) {
    console.error(err);
  }
};

const trySaveGroupLog = async () => {
  try {
    const { status } = (window as any).store.groupStore;
    if (status.up) {
      const { data: status } = await Quorum.getStatus();
      console.log(status);
    }
  } catch (err) {}
};

const trySaveElectronStore = async () => {
  try {
    const appPath = remote.app.getPath('userData');
    const nodeElectronStore = await fs.readFile(
      `${appPath}/${(window as any).store.nodeStore.electronStoreName}.json`,
      'utf8'
    );
    const groupElectronStore = await fs.readFile(
      `${appPath}/${(window as any).store.groupStore.electronStoreName}.json`,
      'utf8'
    );
    console.log(nodeElectronStore);
    console.log(groupElectronStore);
  } catch (err) {}
};

const exportLogs = async () => {
  try {
    await trySaveGroupLog();
    await trySaveElectronStore();
    const file = await remote.dialog.showSaveDialog({
      defaultPath: 'logs.txt',
    });
    if (!file.canceled && file.filePath) {
      await fs.writeFile(
        file.filePath.toString(),
        ((console as any).logs || []).join('\n\r')
      );
    }
  } catch (err) {
    console.error(err);
  }
};

export default {
  setup,
  exportLogs,
};
