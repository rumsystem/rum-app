const path = require('path');
const child_process = require('child_process');
const crypto = require('crypto')
const axios = require('axios');
const { app, ipcMain } = require('electron');
const log = require('electron-log');
const getPort = require('get-port');
const mkdirp = require('mkdirp');

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = !isDevelopment;

const state = {
  /** @type {null | child_process.ChildProcess} */
  process: null,
  port: 0,
  bootstrapId: '',
  logs: '',

  get up() {
    return !!this.process;
  },
};

const actions = {
  status() {
    return {
      up: state.up,
      bootstrapId: state.bootstrapId,
      port: state.port,
      logs: state.logs,
    };
  },
  /**
   * @param peername {string}
   * @param bootstrapId {string}
   */
  async up(param) {
    if (state.process) {
      return this.status();
    }
    const { peername, bootstrapId } = param

    const quorumFileName = {
      linux: 'quorum_linux',
      darwin: 'quorum_darwin',
      win32: 'quorum_win.exe',
    };
    const quorumBaseDir = path.join(
      isProduction ? process.resourcesPath : app.getAppPath(),
      'quorum_bin',
    );
    const cmd = path.join(
      quorumBaseDir,
      quorumFileName[process.platform],
    );
    const hash = crypto.createHash('sha1');
    hash.update(peername)
    const peernameHash = hash.digest('hex')

    const peerPort = await getPort();
    const apiPort = await getPort();
    const args = [
      '-peername',
      peername,
      '-listen',
      `/ip4/127.0.0.1/tcp/${peerPort}`,
      '-apilisten',
      `:${apiPort}`,
      '-peer',
      `/ip4/127.0.0.1/tcp/10666/p2p/${bootstrapId}`,
      '-logtostderr=true',
      '-jsontracer',
      `${peernameHash}.json`,
    ];

    // ensure config dir
    await mkdirp(path.join(quorumBaseDir, 'config'))

    state.logs = '';
    state.bootstrapId = bootstrapId;
    state.port = apiPort;

    const peerProcess = child_process.spawn(cmd, args, {
      cwd: quorumBaseDir,
    })
    state.process = peerProcess

    const handleData = (data) => {
      state.logs += data;
      if (state.logs.length > 131072) {
        state.logs = state.logs.slice(131072 - state.logs.length)
      }
    }

    peerProcess.stdout.on('data', handleData)
    peerProcess.stderr.on('data', handleData)
    peerProcess.on('exit', () => {
      state.process = null;
    })

    return this.status();
  },
  down() {
    if (!state.process) {
      return this.status();
    }
    state.process.kill()
    state.process = null;
    return this.status();
  },
  async request(param) {
    if (!state.process) {
      throw new Error('peer node is not running')
    }

    const request = await axios.default.request({
      url: `http://127.0.0.1:${state.port}${param.url}`,
      method: param.method ?? 'get',
      data: param.data,
    })

    return request.data
  },
};

const initQuorum = () => {
  ipcMain.on('quorum', async (event, arg) => {
    console.log(arg)
    try {
      const result = await actions[arg.action](arg.param);
      event.sender.send('quorum', {
        id: arg.id,
        data: result,
        error: null,
      });
    } catch (err) {
      console.log(err.message);
      if (!isDevelopment) {
        log.error(err);
      }
      event.sender.send('quorum', {
        id: arg.id,
        data: null,
        error: err.message,
      });
    }
  });
}

module.exports = {
  initQuorum,
};

global.quorum = {
  state,
  actions,
}
