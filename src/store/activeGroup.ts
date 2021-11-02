import { IGroup, IContentItem } from 'apis/group';
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

    _contentTrxIds: <string[]>[],

    contentMap: <{ [key: string]: IContentItem }>{},

    justAddedContentTrxId: '',

    contentStatusMap: <{ [key: string]: Status }>{},

    latestContentTimeStampSet: new Set(),

    rearContentTimeStamp: 0,

    filterType: FilterType.ALL,

    filterUserIds: [] as string[],

    electronStoreName: '',

    countMap: {} as any,

    pendingContents: [] as IContentItem[],

    followingSet: new Set(),

    get isActive() {
      return !!this.id;
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

    get contents() {
      this.countMap = {};
      return this.contentTrxIds
        .map((trxId: any) => {
          const content = this.contentMap[trxId];
          this.countMap[content.Publisher] =
            (this.countMap[content.Publisher] || 0) + 1;
          return this.contentMap[trxId];
        })
        .sort((a, b) => b.TimeStamp - a.TimeStamp);
    },

    get following() {
      return Array.from(this.followingSet) as string[];
    },

    get isFilterAll() {
      return this.filterType === FilterType.ALL;
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
      this._contentTrxIds = [];
      this.contentMap = {};
      this.justAddedContentTrxId = '';
      this.latestContentTimeStampSet.clear();
      this.filterType = FilterType.ALL;
      this._syncFromElectronStore();
    },

    addContents(contents: IContentItem[] = []) {
      for (const content of contents) {
        this.addContent(content);
      }
    },

    addContent(content: IContentItem) {
      this.contentStatusMap[content.TrxId] = this.getContentStatus(content);
      if (this.contentMap[content.TrxId]) {
        if (this.contentMap[content.TrxId].Publishing && content.Publisher) {
          this.contentMap[content.TrxId] = content;
        }
      } else {
        this._contentTrxIds.unshift(content.TrxId);
        this.contentMap[content.TrxId] = content;
      }
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

    getContentStatus(content: IContentItem) {
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

    addPendingContent(content: IContentItem) {
      this.pendingContents.push(content);
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
        []) as IContentItem[];
      this.followingSet = new Set(
        (electronStore.get(`following_${this.id}`) || []) as string[]
      );
    },
  };
}
