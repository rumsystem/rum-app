import { Group, CreateGroupsResult, NodeInfo, ContentItem } from 'apis/group';
import Store from 'electron-store';
import { isEmpty } from 'lodash';

const store = new Store();

export function createGroupStore() {
  return {
    nodeInfo: {} as NodeInfo,
    id: '',
    ids: <string[]>[],
    map: <{ [key: string]: Group }>{},
    contentTrxIds: <string[]>[],
    contentMap: <{ [key: string]: ContentItem }>{},
    justAddedContentTrxId: '',
    lastReadContentTrxIds: <string[]>[],
    unReadContents: <ContentItem[]>[],
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
    get isNodeDisconnected() {
      return (
        this.nodeInfo.node_status && this.nodeInfo.node_status !== 'NODE_ONLINE'
      );
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
      this.clear();
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
      this.clear();
    },
    clear() {
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
      store.set(`group_cached_new_contents_${this.id}`, cachedNewContents);
    },
    getCachedNewContentsFromStore() {
      return (store.get(`group_cached_new_contents_${this.id}`) ||
        []) as ContentItem[];
    },
    addContents(contents: ContentItem[] = []) {
      for (const content of contents) {
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
  };
}
