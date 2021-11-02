import { Group, CreateGroupsResult, NodeInfo, ContentItem } from 'apis/group';
import { ProcessStatus } from 'utils/quorum';
import Store from 'electron-store';
import { isEmpty } from 'lodash';
import cryptoRandomString from 'crypto-random-string';
import crypto from 'crypto';
import moment from 'moment';
import { isDevelopment } from 'utils/env';

const STORAGE_CUSTOM_GROUP_NODE_PORT_KEY = 'CUSTOM_GROUP_NODE_PORT';
const STORAGE_GROUP_BOOTSTRAP_ID_KEY = 'GROUP_BOOTSTRAP_ID';
const STORAGE_PEER_NAME_KEY = 'PEER_NAME';
const STORAGE_CAN_USE_CUSTOM_PORT = 'CUSTOM_PORT_ENABLED';

const store = new Store();

export enum Status {
  PUBLISHED,
  PUBLISHING,
  FAILED,
}

export function createGroupStore() {
  return {
    bootstrapId: localStorage.getItem(STORAGE_GROUP_BOOTSTRAP_ID_KEY) || '',

    nodeConnected: false,

    nodePort: Number(
      localStorage.getItem(STORAGE_CUSTOM_GROUP_NODE_PORT_KEY) || ''
    ),

    nodeStatus: <ProcessStatus>{},

    nodeInfo: {} as NodeInfo,

    id: '',

    ids: <string[]>[],

    map: <{ [key: string]: Group }>{},

    contentTrxIds: <string[]>[],

    contentMap: <{ [key: string]: ContentItem }>{},

    justAddedContentTrxId: '',

    lastReadContentTrxIds: <string[]>[],

    unReadContents: <ContentItem[]>[],

    statusMap: <{ [key: string]: Status }>{},

    canUseCustomPort:
      !!localStorage.getItem(STORAGE_CAN_USE_CUSTOM_PORT) || isDevelopment,

    get isSelected() {
      return !!this.id;
    },

    get groups() {
      return this.ids
        .map((id: any) => this.map[id])
        .sort((a, b) => b.LastUpdate - a.LastUpdate);
    },

    get contents() {
      return this.contentTrxIds
        .map((trxId: any) => this.contentMap[trxId])
        .sort((a, b) => b.TimeStamp - a.TimeStamp);
    },

    get isNodeDisconnected() {
      return false;
      // return (
      //   this.nodeInfo.node_status && this.nodeInfo.node_status !== 'NODE_ONLINE'
      // );
    },

    get isUsingCustomNodePort() {
      return !!localStorage.getItem(STORAGE_CUSTOM_GROUP_NODE_PORT_KEY);
    },

    get group() {
      return this.map[this.id] || {};
    },

    get isCurrentGroupOwner() {
      return this.isOwner(this.group);
    },

    get groupSeed() {
      return this.getSeedFromStore(this.id);
    },

    get unReadContentTrxIds() {
      return this.unReadContents.map((content) => content.TrxId);
    },

    get hasUnreadContents() {
      return this.unReadContents.length > 0;
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

    get nodePublicKeyHash() {
      return crypto
        .createHash('md5')
        .update(this.nodeInfo.node_publickey)
        .digest('hex');
    },

    setBootstrapId(id: string) {
      this.bootstrapId = id;
      localStorage.setItem(STORAGE_GROUP_BOOTSTRAP_ID_KEY, id);
    },

    shutdownNode() {
      localStorage.removeItem(STORAGE_PEER_NAME_KEY);
      localStorage.removeItem(STORAGE_GROUP_BOOTSTRAP_ID_KEY);
      localStorage.removeItem(STORAGE_CUSTOM_GROUP_NODE_PORT_KEY);
      this.clearAfterGroupChanged();
      this.id = '';
      this.bootstrapId = '';
      this.nodePort = 0;
      this.ids = [];
      this.map = {};
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

    isOwner(group: Group) {
      if (isEmpty(group)) {
        return false;
      }
      return group.OwnerPubKey === this.nodeInfo.node_publickey;
    },

    setId(id: string) {
      if (this.id === id) {
        return;
      }
      if (!this.map[id]) {
        console.error(`groupStore.setId：id 对应的 group 不存在`);
        return;
      }
      this.id = id;
      this.clearAfterGroupChanged();
    },

    addGroups(groups: Group[] = []) {
      for (const group of groups) {
        if (!this.map[group.GroupId]) {
          this.ids.unshift(group.GroupId);
        }
        this.map[group.GroupId] = group;
      }
    },

    updateGroups(groups: Group[] = []) {
      const current = groups.find((group) => group.GroupId === this.id);
      if (current) {
        this.group.LastUpdate = current.LastUpdate;
        this.group.LatestBlockNum = current.LatestBlockNum;
        this.group.LatestBlockId = current.LatestBlockId;
        this.group.GroupStatus = current.GroupStatus;
      }
    },

    removeGroup() {
      const removedId = this.id;
      this.id = '';
      this.ids = this.ids.filter((id) => id !== removedId);
      delete this.map[removedId];
      this.clearAfterGroupChanged();
    },

    clearAfterGroupChanged() {
      this.contentTrxIds = [];
      this.contentMap = {};
      this.justAddedContentTrxId = '';
      this.lastReadContentTrxIds = [];
      this.unReadContents = [];
    },

    setNodeInfo(nodeInfo: NodeInfo) {
      this.nodeInfo = nodeInfo;
    },

    saveSeedToStore(group: CreateGroupsResult) {
      store.set(`group_seed_${group.group_id}`, group);
    },

    getSeedFromStore(id: string) {
      return store.get(`group_seed_${id}`);
    },

    saveCachedNewContentToStore(content: ContentItem) {
      const cachedNewContents: any = this.getCachedNewContentsFromStore();
      cachedNewContents.push(content);
      store.set(
        `${this.nodePublicKeyHash}_group_cached_new_contents_${this.id}`,
        cachedNewContents
      );
    },

    getCachedNewContentsFromStore() {
      return (store.get(
        `${this.nodePublicKeyHash}_group_cached_new_contents_${this.id}`
      ) || []) as ContentItem[];
    },

    addContents(contents: ContentItem[] = []) {
      for (const content of contents) {
        this.statusMap[content.TrxId] = this.getContentStatus(content);
        if (this.contentMap[content.TrxId]) {
          if (content.Publisher) {
            this.contentMap[content.TrxId] = content;
          }
        } else {
          this.contentTrxIds.unshift(content.TrxId);
          this.contentMap[content.TrxId] = content;
        }
      }
    },

    setJustAddedContentTrxId(trxId: string) {
      this.justAddedContentTrxId = trxId;
    },

    addLastReadContentTrxIds(trxId: string) {
      this.lastReadContentTrxIds.push(trxId);
    },

    addUnreadContents(contents: ContentItem[] = []) {
      for (const content of contents) {
        this.unReadContents.push(content);
      }
    },

    mergeUnReadContents() {
      if (this.contents.length > 0) {
        this.addLastReadContentTrxIds(this.contents[0].TrxId);
      }
      this.addContents(this.unReadContents);
      this.unReadContents = [];
    },

    updateNodeStatus(status: string) {
      this.nodeInfo.node_status = status;
    },

    getContentStatus(content: ContentItem) {
      if (content.Publisher) {
        return Status.PUBLISHED;
      }
      if (
        moment
          .duration(moment().diff(moment(content.TimeStamp / 1000000)))
          .asSeconds() > 20
      ) {
        return Status.FAILED;
      }
      return Status.PUBLISHING;
    },

    markAsFailed(txId: string) {
      this.statusMap[txId] = Status.FAILED;
    },

    enableCustomPort() {
      localStorage.setItem(STORAGE_CAN_USE_CUSTOM_PORT, 'true');
      this.shutdownNode();
      window.location.reload();
    },

    disableCustomPort() {
      localStorage.removeItem(STORAGE_CAN_USE_CUSTOM_PORT);
    },
  };
}
