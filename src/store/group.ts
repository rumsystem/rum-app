import { Group, CreateGroupsResult, ContentItem } from 'apis/group';
import Store from 'electron-store';
import moment from 'moment';

interface LastReadContentTrxIdMap {
  [key: string]: number;
}

export enum Status {
  PUBLISHED,
  PUBLISHING,
  FAILED,
}

const store = new Store();

const STORE_LAST_GROUP_READ_CONTENT_TIME_STAMP_MAP =
  'LAST_GROUP_READ_CONTENT_TIME_STAMP_MAP';

export function createGroupStore() {
  return {
    id: '',

    ids: <string[]>[],

    map: <{ [key: string]: Group }>{},

    contentTrxIds: <string[]>[],

    contentMap: <{ [key: string]: ContentItem }>{},

    justAddedContentTrxId: '',

    unReadContents: <ContentItem[]>[],

    statusMap: <{ [key: string]: Status }>{},

    // for front group
    lastReadContentTimeStamps: <number[]>[],

    // for background groups
    lastReadContentTimeStampMap: (store.get(
      STORE_LAST_GROUP_READ_CONTENT_TIME_STAMP_MAP
    ) || {}) as LastReadContentTrxIdMap,

    unReadCountMap: {} as any,

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

    get groupSeed() {
      return this.getSeedFromStore(this.id);
    },

    get unReadContentTrxIds() {
      return this.unReadContents.map((content) => content.TrxId);
    },

    get hasUnreadContents() {
      return this.unReadContents.length > 0;
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
      this.initLastReadContentTimeStamps();
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

    reset() {
      this.id = '';
      this.ids = [];
      this.map = {};
      this.clearAfterGroupChanged();
    },

    clearAfterGroupChanged() {
      this.contentTrxIds = [];
      this.contentMap = {};
      this.justAddedContentTrxId = '';
      this.lastReadContentTimeStamps = [];
      this.unReadContents = [];
    },

    saveSeedToStore(group: CreateGroupsResult) {
      store.set(`group_seed_${group.group_id}`, group);
    },

    getSeedFromStore(id: string) {
      return store.get(`group_seed_${id}`);
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
      const lastContent = this.contents[0];
      if (lastContent) {
        this.setLastReadContentTimeStamp(this.id, lastContent.TimeStamp);
        this.updateUnReadCountMap(this.id, 0);
      }
    },

    setJustAddedContentTrxId(trxId: string) {
      this.justAddedContentTrxId = trxId;
    },

    addLastReadContentTimeStamps(timestamp: number) {
      this.lastReadContentTimeStamps.push(timestamp);
    },

    addUnreadContents(contents: ContentItem[] = []) {
      for (const content of contents) {
        this.unReadContents.push(content);
      }
    },

    mergeUnReadContents() {
      if (this.contents.length > 0) {
        this.addLastReadContentTimeStamps(this.contents[0].TimeStamp);
      }
      this.addContents(this.unReadContents);
      this.unReadContents = [];
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

    saveCachedNewContentToStore(key: string, content: ContentItem) {
      const cachedNewContents: any = this.getCachedNewContentsFromStore(key);
      cachedNewContents.push(content);
      store.set(key, cachedNewContents);
    },

    getCachedNewContentsFromStore(key: string) {
      return (store.get(key) || []) as ContentItem[];
    },

    setLastReadContentTimeStamp(groupId: string, timeStamp: number) {
      this.lastReadContentTimeStampMap[groupId] = timeStamp;
      store.set(
        STORE_LAST_GROUP_READ_CONTENT_TIME_STAMP_MAP,
        this.lastReadContentTimeStampMap
      );
    },

    updateUnReadCountMap(groupId: string, count: number) {
      this.unReadCountMap[groupId] = count;
    },

    initLastReadContentTimeStamps() {
      if (this.unReadCountMap[this.id]) {
        this.lastReadContentTimeStamps = [
          this.lastReadContentTimeStampMap[this.id] || 0,
        ];
      }
    },
  };
}
