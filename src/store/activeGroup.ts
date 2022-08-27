import { runInAction } from 'mobx';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import { IDbDerivedObjectItem, Order } from 'hooks/useDatabase/models/object';
import { IProfile } from 'apis/content';

export enum Status {
  PUBLISHED,
  PUBLISHING,
  FAILED,
}

export enum ObjectsFilterType {
  ALL,
  FOLLOW,
  SOMEONE,
}

export interface IObjectsFilter {
  type: ObjectsFilterType
  publisher?: string
  publishers?: string[]
  order?: Order
}

export function createActiveGroupStore() {
  return {
    mainLoading: false,

    switchLoading: true,

    id: '',

    hasMoreObjects: false,

    objectTrxIdSet: new Set<string>(),

    objectTrxIds: [] as string[],

    objectMap: {} as Record<string, IDbDerivedObjectItem>,

    latestObjectTimeStampSet: new Set(),

    firstFrontHistoricalObjectTrxId: '',

    objectsFilter: {
      type: ObjectsFilterType.ALL,
      publisher: '',
      publishers: [],
      order: Order.desc,
    } as IObjectsFilter,

    electronStoreName: '',

    profile: {} as IProfile,

    profileMap: {} as Record<string, IProfile>,

    searchActive: false,

    searchText: '',

    cachedGroupObjects: new Map<string, {
      objectTrxIdSet: Set<string>
      objectTrxIds: Array<string>
      objectMap: Record<string, IDbDerivedObjectItem>
      profileMap: Record<string, IProfile>
      hasMoreObjects: boolean
      time: number
    }>(),

    cachedScrollTops: new Map<string, number>(),

    paidRequired: false,

    get isActive() {
      return !!this.id;
    },

    get objectTotal() {
      return this.objectTrxIds.length;
    },

    get objects() {
      return this.objectTrxIds
        .map((trxId) => this.objectMap[trxId]);
    },

    get frontObject() {
      if (this.objectTrxIds.length === 0) {
        return null;
      }
      return this.objectMap[this.objectTrxIds[0]];
    },

    get rearObject() {
      return this.objectMap[this.objectTrxIds[this.objectTrxIds.length - 1]];
    },

    setId(id: string) {
      if (this.id === id) {
        return;
      }
      this.cacheGroupObjects();
      this.id = id;
    },

    clearObjects() {
      runInAction(() => {
        this.objectTrxIdSet = new Set();
        this.objectTrxIds = [];
        this.objectMap = {};
        this.profileMap = {};
        this.hasMoreObjects = false;
      });
    },

    clearAfterGroupChanged() {
      runInAction(() => {
        this.latestObjectTimeStampSet.clear();
        this.firstFrontHistoricalObjectTrxId = '';
        this.profile = {} as IProfile;
        this.searchActive = false;
        this.searchText = '';
        this.paidRequired = false;
      });
    },

    addObject(
      object: IDbDerivedObjectItem,
      options: {
        isFront?: boolean
      } = {},
    ) {
      runInAction(() => {
        if (object.GroupId !== this.id) {
          return;
        }
        if (this.objectTrxIdSet.has(object.TrxId)) {
          return;
        }
        if (options.isFront) {
          const frontHistoricalObjectTrxIds = this.objectTrxIds.filter((trxId) => object.TimeStamp < this.objectMap[trxId].TimeStamp);
          const frontHistoricalObjectCount = frontHistoricalObjectTrxIds.length;
          if (frontHistoricalObjectCount > 0) {
            if (!this.firstFrontHistoricalObjectTrxId) {
              this.firstFrontHistoricalObjectTrxId = frontHistoricalObjectTrxIds[frontHistoricalObjectCount - 1];
            }
            this.objectTrxIds.splice(frontHistoricalObjectCount, 0, object.TrxId);
          } else {
            this.objectTrxIds.unshift(object.TrxId);
          }
        } else {
          this.objectTrxIds.push(object.TrxId);
        }
        this.objectTrxIdSet.add(object.TrxId);
        this.objectMap[object.TrxId] = object;
        this.profileMap[object.Publisher] = object.Extra.user.profile;
      });
    },

    updateObject(trxId: string, object: IDbDerivedObjectItem) {
      this.objectMap[trxId] = object;
    },

    addObjectToMap(trxId: string, object: IDbDerivedObjectItem) {
      this.objectMap[trxId] = object;
    },

    markSyncedObject(trxId: string) {
      this.objectMap[trxId].Status = ContentStatus.synced;
    },

    deleteObjects(trxIds: string[]) {
      runInAction(() => {
        for (const trxId of trxIds) {
          this.objectTrxIdSet.delete(trxId);
          this.objectTrxIds = this.objectTrxIds.filter(
            (_txId) => _txId !== trxId,
          );
          delete this.objectMap[trxId];
        }
      });
    },

    deleteObject(trxId: string) {
      this.deleteObjects([trxId]);
    },

    cacheGroupObjects() {
      this.cachedGroupObjects.set(this.id, {
        objectTrxIdSet: this.objectTrxIdSet,
        objectTrxIds: this.objectTrxIds,
        objectMap: this.objectMap,
        profileMap: this.profileMap,
        hasMoreObjects: this.hasMoreObjects,
        time: Date.now(),
      });
    },

    cacheScrollTop(id: string, scrollTop: number) {
      this.cachedScrollTops.set(id, scrollTop);
    },

    restoreCache(id: string) {
      const cache = this.cachedGroupObjects.get(id);
      if (cache) {
        // don't use cache if idling more than 20 min
        if (Date.now() - cache.time > 1000 * 60 * 20) {
          this.cachedGroupObjects.delete(id);
          return false;
        }
        this.objectTrxIdSet = cache.objectTrxIdSet;
        this.objectTrxIds = cache.objectTrxIds;
        this.objectMap = cache.objectMap;
        this.profileMap = cache.profileMap;
        this.hasMoreObjects = cache.hasMoreObjects;
        this.clearCache(id);
      }
      return !!cache;
    },

    clearCache(id: string) {
      this.cachedGroupObjects.delete(id);
      this.cachedScrollTops.delete(id);
    },

    getCachedObject(groupId: string, trxId: string) {
      const cachedGroup = this.cachedGroupObjects.get(groupId);
      return cachedGroup ? cachedGroup.objectMap[trxId] : null;
    },

    addLatestObjectTimeStamp(timestamp: number) {
      this.latestObjectTimeStampSet.add(timestamp);
    },

    setMainLoading(value: boolean) {
      this.mainLoading = value;
    },

    setSwitchLoading(value: boolean) {
      this.switchLoading = value;
    },

    setHasMoreObjects(value: boolean) {
      this.hasMoreObjects = value;
    },

    setProfile(profile: IProfile) {
      this.profile = profile;
    },

    updateProfileMap(publisher: string, profile: IProfile) {
      if (this.profileMap[publisher]) {
        Object.assign(this.profileMap[publisher], profile);
      }
    },

    tryUpdateCachedProfileMap(groupId: string, publisher: string, profile: IProfile) {
      const cachedGroup = this.cachedGroupObjects.get(groupId);
      if (cachedGroup && cachedGroup.profileMap[publisher]) {
        Object.assign(cachedGroup.profileMap[publisher], profile);
      }
    },

    setSearchActive(value: boolean) {
      this.searchActive = value;
    },

    setSearchText(value: string) {
      this.searchText = value;
    },

    setObjectsFilter(objectsFilter: IObjectsFilter) {
      this.objectsFilter = objectsFilter;
    },

    setPaidRequired(value: boolean) {
      this.paidRequired = value;
    },

    truncateObjects(fromTimeStamp?: number) {
      const removedTrxIds = fromTimeStamp ? this.objectTrxIds.filter((trxId) => this.objectMap[trxId].TimeStamp <= fromTimeStamp) : this.objectTrxIds.slice(30);
      this.deleteObjects(removedTrxIds);
    },
  };
}
