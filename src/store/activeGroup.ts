import { IGroup } from 'apis/group';
import {
  IDbDerivedObjectItem,
  ContentStatus,
  IDbPersonItem,
} from 'store/database';
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

    _objectTrxIdSet: new Set(),

    _objectTrxIds: [] as string[],

    objectMap: <{ [key: string]: IDbDerivedObjectItem }>{},

    timeoutObjectSet: new Set(),

    latestObjectTimeStampSet: new Set(),

    filterType: FilterType.ALL,

    filterUserIds: [] as string[],

    electronStoreName: '',

    followingSet: new Set(),

    person: null as IDbPersonItem | null,

    get isActive() {
      return !!this.id;
    },

    get objectTrxIds() {
      if (this.filterType === FilterType.ALL) {
        return this._objectTrxIds;
      }
      return this._objectTrxIds.filter((id) => {
        const { Publisher } = this.objectMap[id];
        return this.filterUserIds.includes(Publisher);
      });
    },

    get objectTotal() {
      return this.objectTrxIds.length;
    },

    get countMap() {
      let countMap: Record<string, number> = {};
      this.objectTrxIds.forEach((trxId) => {
        const content = this.objectMap[trxId];
        countMap[content.Publisher] = (countMap[content.Publisher] || 0) + 1;
        return this.objectMap[trxId];
      });
      return countMap;
    },

    get objects() {
      return this.objectTrxIds.map((trxId: any) => this.objectMap[trxId]);
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
      this._objectTrxIdSet.clear();
      this._objectTrxIds = [];
      this.objectMap = {};
      this.latestObjectTimeStampSet.clear();
      this.filterType = FilterType.ALL;
      this.person = null;
      this._syncFromElectronStore();
    },

    addObject(
      object: IDbDerivedObjectItem,
      options: {
        isFront?: boolean;
      } = {}
    ) {
      if (this._objectTrxIdSet.has(object.TrxId)) {
        return;
      }
      this.tryMarkTimeoutObject(object);
      if (options.isFront) {
        this._objectTrxIds.unshift(object.TrxId);
      } else {
        this._objectTrxIds.push(object.TrxId);
      }
      this._objectTrxIdSet.add(object.TrxId);
      this.objectMap[object.TrxId] = object;
    },

    tryMarkTimeoutObject(object: IDbDerivedObjectItem) {
      if (
        object.Status === ContentStatus.Syncing &&
        moment
          .duration(moment().diff(moment(object.TimeStamp / 1000000)))
          .asSeconds() > 20
      ) {
        this.markTimeoutObject(object.TrxId);
      }
    },

    markTimeoutObject(trxId: string) {
      this.timeoutObjectSet.add(trxId);
    },

    markSyncedObject(trxId: string) {
      this.objectMap[trxId].Status = ContentStatus.Synced;
    },

    deleteObject(trxId: string) {
      this._objectTrxIdSet.delete(trxId);
      this._objectTrxIds = this._objectTrxIds.filter(
        (_txId) => _txId !== trxId
      );
      delete this.objectMap[trxId];
    },

    addLatestContentTimeStamp(timestamp: number) {
      this.latestObjectTimeStampSet.add(timestamp);
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

    addFollowing(publisher: string) {
      this.followingSet.add(publisher);
      electronStore.set(`following_${this.id}`, this.following);
    },

    deleteFollowing(publisher: string) {
      this.followingSet.delete(publisher);
      electronStore.set(`following_${this.id}`, this.following);
    },

    setPerson(person: IDbPersonItem | null) {
      this.person = person;
    },

    _syncFromElectronStore() {
      this.followingSet = new Set(
        (electronStore.get(`following_${this.id}`) || []) as string[]
      );
    },
  };
}
