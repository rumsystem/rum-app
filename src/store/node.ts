import { INodeInfo, INetwork, INetworkGroup } from 'apis/group';
import { ProcessStatus } from 'utils/quorum';
import externalNodeMode from 'utils/storages/externalNodeMode';
import Store from 'electron-store';

type Mode = 'INTERNAL' | 'EXTERNAL' | '';

const DEFAULT_API_HOST = '127.0.0.1';
const ELECTRON_STORE_NAME = 'node';

const store = new Store({
  name: ELECTRON_STORE_NAME,
});

export function createNodeStore() {
  return {
    connected: false,

    quitting: false,

    apiHost: DEFAULT_API_HOST,

    port: 0,

    jwt: (store.get('jwt') as string) || '',

    cert: (store.get('cert') as string) || '',

    status: <ProcessStatus>{},

    info: {} as INodeInfo,

    network: {} as INetwork,

    storagePath: (store.get('storagePath') || '') as string,

    mode: (store.get('mode') || '') as Mode,

    canUseExternalMode: externalNodeMode.enabled(),

    electronStoreName: ELECTRON_STORE_NAME,

    get groupNetworkMap() {
      const map = {} as Record<string, INetworkGroup>;
      for (const groupNetwork of this.network.groups || []) {
        map[groupNetwork.GroupId] = groupNetwork;
      }
      return map;
    },

    get disconnected() {
      return false;
    },

    get storePort() {
      return (store.get('port') || 0) as number;
    },

    get storeApiHost() {
      return (store.get('apiHost') || '') as string;
    },

    setConnected(value: boolean) {
      this.connected = value;
    },

    setStatus(ProcessStatus: ProcessStatus) {
      this.status = ProcessStatus;
    },

    setPort(port: number) {
      this.port = port;
      store.set('port', port);
    },

    setJWT(jwt: string) {
      this.jwt = jwt;
      store.set('jwt', jwt);
    },

    setCert(cert: string) {
      this.cert = cert;
      store.set('cert', cert);
    },

    setApiHost(host: string) {
      this.apiHost = host;
      store.set('apiHost', host);
    },

    resetApiHost() {
      store.delete('apiHost');
      this.apiHost = DEFAULT_API_HOST;
    },

    resetElectronStore() {
      if (!store) {
        return;
      }
      store.clear();
    },

    setMode(mode: Mode) {
      this.mode = mode;
      store.set('mode', mode);
    },

    setInfo(info: INodeInfo) {
      this.info = info;
    },

    setNetwork(network: INetwork) {
      this.network = network;
    },

    updateStatus(status: string) {
      this.info.node_status = status;
    },

    setStoragePath(path: string) {
      this.storagePath = path;
      store.set('storagePath', path);
    },

    setQuitting(value: boolean) {
      this.quitting = value;
    },
  };
}
