const path = require('path');
const fs = require('fs');
const childProcess = require('child_process');
const { app, ipcMain } = require('electron');
const getPort = require('get-port');
const watch = require('node-watch');

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = !isDevelopment;
const quorumBaseDir = path.join(
  isProduction ? process.resourcesPath : app.getAppPath(),
  'quorum_bin',
);
const certDir = path.join(quorumBaseDir, 'certs');
const certPath = path.join(quorumBaseDir, 'certs/server.crt');
const quorumFileName = {
  linux: 'quorum_linux',
  darwin: 'quorum_darwin',
  win32: 'quorum_win.exe',
};
const cmd = path.join(
  quorumBaseDir,
  quorumFileName[process.platform],
);

const state = {
  process: null,
  port: 0,
  host: '',
  bootstrapId: '',
  storagePath: '',
  logs: '',
  cert: '',
  userInputCert: '',

  get up() {
    return !!this.process;
  },
};

const actions = {
  status() {
    return {
      up: state.up,
      bootstrapId: state.bootstrapId,
      storagePath: state.storagePath,
      host: state.host,
      port: state.port,
      logs: state.logs,
    };
  },
  async up(param) {
    if (state.up) {
      return this.status();
    }
    const { host, bootstrapId, storagePath } = param;

    const peerPort = await getPort();
    const apiPort = await getPort();
    const args = [
      '-peername',
      'peer',
      '-listen',
      `/ip4/0.0.0.0/tcp/${peerPort}`,
      '-apilisten',
      `:${apiPort}`,
      '-peer',
      `/ip4/${host}/tcp/10666/p2p/${bootstrapId}`,
      '-configdir',
      `${storagePath}/peerConfig`,
      '-datadir',
      `${storagePath}/peerData`,
    ];

    // ensure config dir
    await fs.promises.mkdir(path.join(quorumBaseDir, 'config')).catch((e) => {
      if (e.code === 'EEXIST') {
        return;
      }
      console.error(e);
    });

    state.type = param.type;
    state.logs = '';
    state.host = host;
    state.bootstrapId = bootstrapId;
    state.storagePath = storagePath;
    state.port = apiPort;

    console.log('spawn quorum: ');
    console.log(state);
    console.log(args);

    const peerProcess = childProcess.spawn(cmd, args, {
      cwd: quorumBaseDir,
    });

    peerProcess.on('error', (err) => {
      this.down();
      console.error(err);
    });

    state.process = peerProcess;

    const handleData = (data) => {
      state.logs += data;
      if (state.logs.length > 131072) {
        state.logs = state.logs.slice(131072 - state.logs.length);
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
    state.process?.kill();
    state.process = null;
    return this.status();
  },
  set_cert(param) {
    state.userInputCert = param.cert ?? '';
  },
};

const initQuorum = async () => {
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
        error: err.message,
      });
    }
  });

  await fs.promises.mkdir(quorumBaseDir).catch((e) => {
    if (e.code === 'EEXIST') {
      return;
    }
    console.error(e);
  });

  await fs.promises.mkdir(certDir).catch((e) => {
    if (e.code === 'EEXIST') {
      return;
    }
    console.error(e);
  });

  const loadCert = async () => {
    try {
      const buf = await fs.promises.readFile(certPath);
      state.cert = buf.toString();
      console.log('load cert');
    } catch (e) {
      state.cert = '';
    }
  };

  watch(
    certDir,
    { recursive: true },
    loadCert,
  );
  loadCert();
};

module.exports = {
  state,
  initQuorum,
};
