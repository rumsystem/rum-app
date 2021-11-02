import { INodeInfo } from 'apis/group';
import { ProcessStatus } from 'utils/quorum';
import cryptoRandomString from 'crypto-random-string';
import { isDevelopment } from 'utils/env';
import CustomPort from 'utils/storages/customPort';

const STORAGE_CUSTOM_GROUP_NODE_PORT_KEY = 'CUSTOM_GROUP_NODE_PORT';
const STORAGE_GROUP_BOOTSTRAP_ID_KEY = 'GROUP_BOOTSTRAP_ID';
const STORAGE_PEER_NAME_KEY = 'PEER_NAME';

export function createNodeStore() {
  return {
    bootstrapId: localStorage.getItem(STORAGE_GROUP_BOOTSTRAP_ID_KEY) || '',

    connected: false,

    port: Number(
      localStorage.getItem(STORAGE_CUSTOM_GROUP_NODE_PORT_KEY) || ''
    ),

    status: <ProcessStatus>{},

    info: {} as INodeInfo,

    canUseCustomPort: CustomPort.enabled() || isDevelopment,

    get disconnected() {
      return false;
      // return (
      //   this.info.node_status && this.info.node_status !== 'NODE_ONLINE'
      // );
    },

    get isUsingCustomPort() {
      return !!localStorage.getItem(STORAGE_CUSTOM_GROUP_NODE_PORT_KEY);
    },

    get config() {
      let peerName = localStorage.getItem(STORAGE_PEER_NAME_KEY);
      if (!peerName) {
        peerName = `peer_${cryptoRandomString(10)}`;
        localStorage.setItem(STORAGE_PEER_NAME_KEY, peerName);
      }
      return {
        type: 'process',
        peername: peerName,
        bootstrapId: this.bootstrapId,
      };
    },

    setBootstrapId(id: string) {
      this.bootstrapId = id;
      localStorage.setItem(STORAGE_GROUP_BOOTSTRAP_ID_KEY, id);
    },

    reset() {
      localStorage.removeItem(STORAGE_PEER_NAME_KEY);
      localStorage.removeItem(STORAGE_GROUP_BOOTSTRAP_ID_KEY);
      localStorage.removeItem(STORAGE_CUSTOM_GROUP_NODE_PORT_KEY);
      this.bootstrapId = '';
      this.port = 0;
    },

    setConnected(value: boolean) {
      this.connected = value;
    },

    setStatus(ProcessStatus: ProcessStatus) {
      this.status = ProcessStatus;
      this.port = this.status.port;
    },

    setCustomPort(port: number) {
      this.port = port;
      localStorage.setItem(STORAGE_CUSTOM_GROUP_NODE_PORT_KEY, String(port));
    },

    resetPort() {
      localStorage.removeItem(STORAGE_CUSTOM_GROUP_NODE_PORT_KEY);
    },

    setInfo(info: INodeInfo) {
      this.info = info;
    },

    updateStatus(status: string) {
      this.info.node_status = status;
    },
  };
}
