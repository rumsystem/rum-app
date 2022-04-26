import { runInAction } from 'mobx';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import type { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import * as FollowingModel from 'hooks/useOffChainDatabase/models/following';
import * as BlockListModel from 'hooks/useOffChainDatabase/models/blockList';
import type OffChainDatabase from 'hooks/useOffChainDatabase/database';
import { IProfile } from 'store/group';

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

    objectsFilter: {
      type: ObjectsFilterType.ALL,
      publisher: '',
      publishers: [],
    } as IObjectsFilter,

    electronStoreName: '',

    followingSet: new Set<string>(),

    blockListSet: new Set<string>(),

    latestPersonStatus: '' as ContentStatus,

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

    get isActive() {
      return !!this.id;
    },

    get objectTotal() {
      return this.objectTrxIds.length;
    },

    get objects() {
      return this.objectTrxIds
        .map((trxId) => this.objectMap[trxId])
        .sort((a, b) => b.TimeStamp - a.TimeStamp);
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

    get followings() {
      return Array.from(this.followingSet);
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
        this.profile = {} as IProfile;
        this.searchActive = false;
        this.searchText = '';
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
          this.objectTrxIds.unshift(object.TrxId);
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

    markSyncedObject(trxId: string) {
      this.objectMap[trxId].Status = ContentStatus.synced;
    },

    deleteObject(trxId: string) {
      runInAction(() => {
        this.objectTrxIdSet.delete(trxId);
        this.objectTrxIds = this.objectTrxIds.filter(
          (_txId) => _txId !== trxId,
        );
        delete this.objectMap[trxId];
      });
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

    _getCachedObject(groupId: string, trxId: string) {
      const cachedGroup = this.cachedGroupObjects.get(groupId);
      return cachedGroup ? cachedGroup.objectMap[trxId] : null;
    },

    tryMarkAsSyncedOfCachedObjects(groupId: string, trxId: string) {
      const cachedObject = this._getCachedObject(groupId, trxId);
      if (cachedObject) {
        cachedObject.Status = ContentStatus.synced;
      }
    },

    tryIncreaseCommentCountOfCachedObject(groupId: string, trxId: string) {
      const cachedObject = this._getCachedObject(groupId, trxId);
      if (cachedObject) {
        cachedObject.commentCount = (cachedObject.commentCount || 0) + 1;
      }
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

    async fetchFollowings(
      offChainDatabase: OffChainDatabase,
      options: {
        groupId: string
      },
    ) {
      const followings = await FollowingModel.list(offChainDatabase, {
        GroupId: options.groupId,
      });
      this.followingSet = new Set(
        followings.map((following) => following.Publisher),
      );
    },

    async follow(
      offChainDatabase: OffChainDatabase,
      options: {
        groupId: string
        publisher: string
      },
    ) {
      try {
        const following = {
          GroupId: options.groupId,
          Publisher: options.publisher,
          TimeStamp: Date.now() * 1000000,
        };
        await FollowingModel.create(offChainDatabase, following);
        this.followingSet.add(options.publisher);
      } catch (err) {
        console.log(err);
      }
    },

    async unFollow(
      offChainDatabase: OffChainDatabase,
      options: {
        groupId: string
        publisher: string
      },
    ) {
      try {
        await FollowingModel.remove(offChainDatabase, {
          GroupId: options.groupId,
          Publisher: options.publisher,
        });
        this.followingSet.delete(options.publisher);
      } catch (err) {
        console.log(err);
      }
    },


    async fetchBlockList(
      offChainDatabase: OffChainDatabase,
      options: {
        groupId: string
      },
    ) {
      const blockList = await BlockListModel.list(offChainDatabase, {
        GroupId: options.groupId,
      });
      this.blockListSet = new Set(
        blockList.map((block) => block.Publisher),
      );
    },

    async block(
      offChainDatabase: OffChainDatabase,
      options: {
        groupId: string
        publisher: string
      },
    ) {
      try {
        const block = {
          GroupId: options.groupId,
          Publisher: options.publisher,
          TimeStamp: Date.now() * 1000000,
        };
        await BlockListModel.create(offChainDatabase, block);
        this.blockListSet.add(options.publisher);
      } catch (err) {
        console.log(err);
      }
    },

    async allow(
      offChainDatabase: OffChainDatabase,
      options: {
        groupId: string
        publisher: string
      },
    ) {
      try {
        await BlockListModel.remove(offChainDatabase, {
          GroupId: options.groupId,
          Publisher: options.publisher,
        });
        this.blockListSet.delete(options.publisher);
      } catch (err) {
        console.log(err);
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

    setLatestPersonStatus(latestPersonStatus: ContentStatus) {
      this.latestPersonStatus = latestPersonStatus;
    },
  };
}
