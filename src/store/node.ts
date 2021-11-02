import { NodeInfo } from 'apis/group';
import { ProcessStatus } from 'utils/quorum';
import cryptoRandomString from 'crypto-random-string';
import { isDevelopment } from 'utils/env';

const STORAGE_CUSTOM_GROUP_NODE_PORT_KEY = 'CUSTOM_GROUP_NODE_PORT';
const STORAGE_GROUP_BOOTSTRAP_ID_KEY = 'GROUP_BOOTSTRAP_ID';
const STORAGE_PEER_NAME_KEY = 'PEER_NAME';
const STORAGE_CAN_USE_CUSTOM_PORT = 'CUSTOM_PORT_ENABLED';

export function createNodeStore() {
  return {
    bootstrapId: localStorage.getItem(STORAGE_GROUP_BOOTSTRAP_ID_KEY) || '',

    nodeConnected: false,

    nodePort: Number(
      localStorage.getItem(STORAGE_CUSTOM_GROUP_NODE_PORT_KEY) || ''
    ),

    nodeStatus: <ProcessStatus>{},

    nodeInfo: {} as NodeInfo,

    canUseCustomPort:
      !!localStorage.getItem(STORAGE_CAN_USE_CUSTOM_PORT) || isDevelopment,

    get isNodeDisconnected() {
      return false;
      // return (
      //   this.nodeInfo.node_status && this.nodeInfo.node_status !== 'NODE_ONLINE'
      // );
    },

    get isUsingCustomNodePort() {
      return !!localStorage.getItem(STORAGE_CUSTOM_GROUP_NODE_PORT_KEY);
    },

    get nodeConfig() {
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
      this.nodePort = 0;
    },

    setNodeConnected(value: boolean) {
      this.nodeConnected = value;
    },

    setNodeStatus(ProcessStatus: ProcessStatus) {
      this.nodeStatus = ProcessStatus;
      this.nodePort = this.nodeStatus.port;
    },

    setCustomNodePort(port: number) {
      this.nodePort = port;
      localStorage.setItem(STORAGE_CUSTOM_GROUP_NODE_PORT_KEY, String(port));
    },

    resetNodePort() {
      localStorage.removeItem(STORAGE_CUSTOM_GROUP_NODE_PORT_KEY);
    },

    setNodeInfo(nodeInfo: NodeInfo) {
      this.nodeInfo = nodeInfo;
    },

    updateNodeStatus(status: string) {
      this.nodeInfo.node_status = status;
    },
  };
}
