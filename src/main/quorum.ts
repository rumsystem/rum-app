import path from 'path';
import fs from 'fs';
import childProcess, { ChildProcess } from 'child_process';
import { app, ipcMain } from 'electron';
import getPort from 'get-port';
import ElectronStore from 'electron-store';
import TOML from '@iarna/toml';

const store = new ElectronStore({
  name: 'quorum_port_store',
});

const quorumBaseDir = app.isPackaged
  ? path.join(process.resourcesPath, 'quorum-bin')
  : path.join(app.getAppPath(), 'node_modules', 'quorum-bin');
const quorumFileName: Record<string, string> = {
  linux: 'quorum_linux',
  darwin: 'quorum_darwin',
  win32: 'quorum_win.exe',
};
const cmd = path.join(
  quorumBaseDir,
  quorumFileName[process.platform],
);

const getRumPort = async (port: number) => {
  if (!port) {
    return getPort({ port: getPort.makeRange(11000, 65535) });
  }
  const newPort = await getPort({ port });
  if (newPort < 11000) {
    return getPort({ port: getPort.makeRange(11000, 65535) });
  }
  return newPort;
};

export const state = {
  process: null as null | ChildProcess,
  port: 0,
  storagePath: '',
  logs: '',
  userInputCert: '',

  bootstraps: '',
  type: '',

  get up() {
    return !!this.process;
  },
};

const actions: Record<string, (...args: Array<unknown>) => unknown> = {
  status() {
    return {
      up: state.up,
      bootstraps: state.bootstraps,
      storagePath: state.storagePath,
      port: state.port,
      logs: state.logs,
    };
  },
  logs() {
    return {
      logs: state.logs,
    };
  },
  async up(param: any) {
    if (state.up) {
      return this.status();
    }
    const { storagePath, password = '', debugQuorum = false } = param;

    const peerPort = await getRumPort(store.get('peerPort') as number ?? 0);
    const peerWsPort = await getRumPort(store.get('peerWsPort') as number ?? 0);
    const apiPort = await getRumPort(store.get('apiPort') as number ?? 0);
    store.set('peerPort', peerPort);
    store.set('apiPort', apiPort);

    const quorumConfig = await getQuorumConfig(`${storagePath}/peerConfig/peer_options.toml`);

    const bootstraps = quorumConfig.bootstraps || param.bootstraps.join(',');

    const args = [
      'fullnode',
      '--peername',
      'peer',
      '--listen',
      `/ip4/0.0.0.0/tcp/${peerPort}`,
      '--listen',
      `/ip4/0.0.0.0/tcp/${peerWsPort}/ws`,
      '--apiport',
      `${apiPort}`,
      '--peer',
      bootstraps,
      '--configdir',
      `${storagePath}/peerConfig`,
      '--datadir',
      `${storagePath}/peerData`,
      '--keystoredir',
      `${storagePath}/keystore`,
    ];

    if (debugQuorum) {
      args.push('--debug');
      args.push('true');
    }

    // ensure config dir
    await fs.promises.mkdir(path.join(quorumBaseDir, 'config')).catch((e) => {
      if (e.code === 'EEXIST') {
        return;
      }
      console.error(e);
    });

    state.type = param.type;
    state.logs = '';
    state.userInputCert = '';
    state.bootstraps = bootstraps;
    state.storagePath = storagePath;
    state.port = apiPort;

    console.log('spawn quorum: ');
    console.log(state);
    console.log(cmd, args.join(' '));

    const peerProcess = childProcess.spawn(cmd, args, {
      cwd: quorumBaseDir,
      env: { ...process.env, RUM_KSPASSWD: password },
    });

    peerProcess.on('error', (err) => {
      this.down();
      console.error(err);
    });

    state.process = peerProcess;

    const handleData = (data: Buffer | string) => {
      state.logs += data;
      if (state.logs.length > 1.5 * 1024 ** 2) {
        state.logs = state.logs.slice(1.5 * 1024 ** 2 - state.logs.length);
      }
    };

    peerProcess.stdout.on('data', handleData);
    peerProcess.stderr.on('data', handleData);
    peerProcess.on('exit', () => {
      state.process = null;
    });

    return this.status();
  },
  down() {
    if (!state.up) {
      return this.status();
    }
    console.log('quorum down');
    state.process?.kill();
    state.process = null;
    return this.status();
  },
  set_cert(param: any) {
    state.userInputCert = param.cert ?? '';
  },
  exportKey(param: any) {
    console.error('test');
    const { backupPath, storagePath, password } = param;
    const args = [
      '--backup',
      '--peername',
      'peer',
      '--backup-file',
      backupPath,
      '--password',
      password,
      '--configdir',
      `${storagePath}/peerConfig`,
      '--seeddir',
      `${storagePath}/seeds`,
      '--keystoredir',
      `${storagePath}/keystore`,
      '--datadir',
      `${storagePath}/peerData`,
    ];
    const command = [cmd, ...args].join(' ');

    console.log('exportKeyData: ');
    console.log(command);
    console.log(args);

    return new Promise((resovle, reject) => {
      const exportProcess = childProcess.spawn(cmd, args, {
        cwd: quorumBaseDir,
      });

      exportProcess.on('error', (err) => {
        reject(err);
        console.error(err);
      });

      const handleData = (data: Buffer | string) => {
        state.logs += data;
        if (state.logs.length > 1.5 * 1024 ** 2) {
          state.logs = state.logs.slice(1.5 * 1024 ** 2 - state.logs.length);
        }
      };
      exportProcess.stdout.on('data', handleData);
      exportProcess.stderr.on('data', handleData);
      exportProcess.on('close', (code) => {
        if (code === 0) {
          resovle('success');
        } else {
          reject(new Error(state.logs));
        }
      });
    });
  },
  exportKeyWasm(param: any) {
    console.error('test');
    const { backupPath, storagePath, password } = param;
    const args = [
      '-backup-to-wasm',
      '-peername',
      'peer',
      '-backup-file',
      backupPath,
      '-password',
      password,
      '-configdir',
      `${storagePath}/peerConfig`,
      '-seeddir',
      `${storagePath}/seeds`,
      '-keystoredir',
      `${storagePath}/keystore`,
      '-datadir',
      `${storagePath}/peerData`,
    ];
    const command = [cmd, ...args].join(' ');

    console.log('exportKeyWasmData: ');
    console.log(command);
    console.log(args);

    return new Promise((resovle, reject) => {
      const exportProcess = childProcess.spawn(cmd, args, {
        cwd: quorumBaseDir,
      });

      exportProcess.on('error', (err) => {
        reject(err);
        console.error(err);
      });

      const handleData = (data: Buffer | string) => {
        state.logs += data;
        if (state.logs.length > 1.5 * 1024 ** 2) {
          state.logs = state.logs.slice(1.5 * 1024 ** 2 - state.logs.length);
        }
      };
      exportProcess.stdout.on('data', handleData);
      exportProcess.stderr.on('data', handleData);
      exportProcess.on('close', (code) => {
        if (code === 0) {
          resovle('success');
        } else {
          reject(new Error(state.logs));
        }
      });
    });
  },
  importKey(param: any) {
    console.error('test');
    const { backupPath, storagePath, password } = param;
    const args = [
      '-restore',
      '-peername',
      'peer',
      '-backup-file',
      backupPath,
      '-password',
      password,
      '-configdir',
      `${storagePath}/peerConfig`,
      '-seeddir',
      `${storagePath}/seeds`,
      '-keystoredir',
      `${storagePath}/keystore`,
      '-datadir',
      `${storagePath}/peerData`,
    ];
    const command = [cmd, ...args].join(' ');

    console.log('importKeyData: ');
    console.log(command);
    console.log(args);

    return new Promise((resovle, reject) => {
      const importProcess = childProcess.spawn(cmd, args, {
        cwd: quorumBaseDir,
      });

      importProcess.on('error', (err) => {
        reject(err);
        console.error(err);
      });

      const handleData = (data: Buffer | string) => {
        state.logs += data;
        if (state.logs.length > 1.5 * 1024 ** 2) {
          state.logs = state.logs.slice(1.5 * 1024 ** 2 - state.logs.length);
        }
      };
      importProcess.stdout.on('data', handleData);
      importProcess.stderr.on('data', handleData);
      importProcess.on('close', (code) => {
        if (code === 0) {
          resovle('success');
        } else {
          reject(new Error(state.logs));
        }
      });
    });
  },
  importKeyWasm(param: any) {
    console.error('test');
    const { backupPath, storagePath, password } = param;
    const args = [
      '-restore-from-wasm',
      '-peername',
      'peer',
      '-backup-file',
      backupPath,
      '-password',
      password,
      '-configdir',
      `${storagePath}/peerConfig`,
      '-seeddir',
      `${storagePath}/seeds`,
      '-keystoredir',
      `${storagePath}/keystore`,
      '-datadir',
      `${storagePath}/peerData`,
    ];
    const command = [cmd, ...args].join(' ');

    console.log('importKeyData: ');
    console.log(command);
    console.log(args);

    return new Promise((resovle, reject) => {
      const importProcess = childProcess.spawn(cmd, args, {
        cwd: quorumBaseDir,
      });

      importProcess.on('error', (err) => {
        reject(err);
        console.error(err);
      });

      const handleData = (data: Buffer | string) => {
        state.logs += data;
        if (state.logs.length > 1.5 * 1024 ** 2) {
          state.logs = state.logs.slice(1.5 * 1024 ** 2 - state.logs.length);
        }
      };
      importProcess.stdout.on('data', handleData);
      importProcess.stderr.on('data', handleData);
      importProcess.on('close', (code) => {
        if (code === 0) {
          resovle('success');
        } else {
          reject(new Error(state.logs));
        }
      });
    });
  },
};

export const initQuorum = async () => {
  ipcMain.on('quorum', async (event, arg) => {
    try {
      const result = await actions[arg.action](arg.param);
      event.sender.send('quorum', {
        id: arg.id,
        data: result,
        error: null,
      });
    } catch (err) {
      console.error(err);
      event.sender.send('quorum', {
        id: arg.id,
        data: null,
        error: (err as Error).message,
      });
    }
  });

  await fs.promises.mkdir(quorumBaseDir).catch((e) => {
    if (e.code === 'EEXIST') {
      return;
    }
    console.error(e);
  });
};

async function getQuorumConfig(configPath: string) {
  try {
    const configToml = await fs.promises.readFile(configPath);
    return TOML.parse(configToml.toString());
  } catch (err) {}
  return {};
}
