import { IGroup, IObjectItem } from 'apis/group';
import Store from 'electron-store';
import moment from 'moment';

export enum Status {
  PUBLISHED,
  PUBLISHING,
  FAILED,
}

export enum FilterType {
  ALL,
  FOLLOW,
  ME,
  SOMEONE,
}

export function createActiveGroupStore() {
  let electronStore: Store;

  return {
    loading: false,

    id: '',

    ids: <string[]>[],

    map: <{ [key: string]: IGroup }>{},

    _contentTrxIdSet: new Set(),

    contentMap: <{ [key: string]: IObjectItem }>{},

    justAddedContentTrxId: '',

    contentStatusMap: <{ [key: string]: Status }>{},

    latestContentTimeStampSet: new Set(),

    rearContentTimeStamp: 0,

    filterType: FilterType.ALL,

    filterUserIds: [] as string[],

    electronStoreName: '',

    pendingContents: [] as IObjectItem[],

    followingSet: new Set(),

    get isActive() {
      return !!this.id;
    },

    get _contentTrxIds() {
      return Array.from(this._contentTrxIdSet) as string[];
    },

    get contentTrxIds() {
      if (this.filterType === FilterType.ALL) {
        return this._contentTrxIds;
      }
      return this._contentTrxIds.filter((id) => {
        const { Publisher } = this.contentMap[id];
        return this.filterUserIds.includes(Publisher);
      });
    },

    get contentTotal() {
      return this.contentTrxIds.length;
    },

    get countMap() {
      let countMap: Record<string, number> = {};
      this.contentTrxIds.forEach((trxId) => {
        const content = this.contentMap[trxId];
        countMap[content.Publisher] = (countMap[content.Publisher] || 0) + 1;
        return this.contentMap[trxId];
      });
      return countMap;
    },

    get contents() {
      return this.contentTrxIds
        .map((trxId: any) => this.contentMap[trxId])
        .sort((a, b) => b.TimeStamp - a.TimeStamp);
    },

    get following() {
      return Array.from(this.followingSet) as string[];
    },

    get isFilterAll() {
      return this.filterType === FilterType.ALL;
    },

    get pendingContentTxIds() {
      return this.pendingContents.map((content) => content.TrxId);
    },

    initElectronStore(name: string) {
      electronStore = new Store({
        name,
      });
      this.electronStoreName = name;
      this._syncFromElectronStore();
    },

    resetElectronStore() {
      if (!electronStore) {
        return;
      }
      electronStore.clear();
    },

    setId(id: string) {
      if (this.id === id) {
        return;
      }
      this.id = id;
      this.clearAfterGroupChanged();
    },

    clearAfterGroupChanged() {
      this._contentTrxIdSet.clear();
      this.contentMap = {};
      this.justAddedContentTrxId = '';
      this.latestContentTimeStampSet.clear();
      this.filterType = FilterType.ALL;
      this._syncFromElectronStore();
    },

    addContents(contents: IObjectItem[] = []) {
      for (const content of contents) {
        this.addContent(content);
      }
    },

    addContent(content: IObjectItem) {
      this.contentStatusMap[content.TrxId] = this.getContentStatus(content);
      if (this.contentMap[content.TrxId]) {
        if (this.contentMap[content.TrxId].Publishing && content.Publisher) {
          this.contentMap[content.TrxId] = content;
        }
      } else {
        this._contentTrxIdSet.add(content.TrxId);
        this.contentMap[content.TrxId] = content;
      }
    },

    deleteContent(txId: string) {
      this._contentTrxIdSet.delete(txId);
      delete this.contentMap[txId];
    },

    setJustAddedContentTrxId(trxId: string) {
      this.justAddedContentTrxId = trxId;
    },

    addLatestContentTimeStamp(timestamp: number) {
      this.latestContentTimeStampSet.add(timestamp);
    },

    setRearContentTimeStamp(timeStamp: number) {
      this.rearContentTimeStamp = timeStamp;
    },

    getContentStatus(content: IObjectItem) {
      if (!content.Publishing) {
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
      this.contentStatusMap[txId] = Status.FAILED;
    },

    setFilterType(filterType: FilterType) {
      this.filterType = filterType;
    },

    setFilterUserIds(userIds: string[]) {
      this.filterUserIds = userIds;
    },

    setLoading(value: boolean) {
      this.loading = value;
    },

    addPendingContent(content: IObjectItem) {
      this.pendingContents.push(content);
      electronStore.set(`pendingContents_${this.id}`, this.pendingContents);
    },

    deletePendingContents(contentTxIds: string[]) {
      this.pendingContents = this.pendingContents.filter(
        (content) => !contentTxIds.includes(content.TrxId)
      );
      electronStore.set(`pendingContents_${this.id}`, this.pendingContents);
    },

    addFollowing(publisher: string) {
      this.followingSet.add(publisher);
      electronStore.set(`following_${this.id}`, this.following);
    },

    deleteFollowing(publisher: string) {
      this.followingSet.delete(publisher);
      electronStore.set(`following_${this.id}`, this.following);
    },

    _syncFromElectronStore() {
      this.pendingContents = (electronStore.get(`pendingContents_${this.id}`) ||
        []) as IObjectItem[];
      this.followingSet = new Set(
        (electronStore.get(`following_${this.id}`) || []) as string[]
      );
    },
  };
}
