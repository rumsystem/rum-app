import { runInAction } from 'mobx';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import { IDBPost, Order } from 'hooks/useDatabase/models/posts';
import { IDBProfile } from 'hooks/useDatabase/models/profile';

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

    hasMorePosts: false,

    postIdSet: new Set<string>(),

    postIds: [] as string[],

    postMap: {} as Record<string, IDBPost>,

    latestPostTimeStampSet: new Set(),

    firstFrontHistoricalObjectId: '',

    objectsFilter: {
      type: ObjectsFilterType.ALL,
      publisher: '',
      publishers: [],
      order: Order.desc,
    } as IObjectsFilter,

    electronStoreName: '',

    profile: {} as IDBProfile,

    profileMap: {} as Record<string, IDBProfile>,

    searchActive: false,

    searchText: '',

    cachedGroupObjects: new Map<string, {
      objectTrxIdSet: Set<string>
      objectTrxIds: Array<string>
      objectMap: Record<string, IDBPost>
      profileMap: Record<string, IDBProfile>
      hasMoreObjects: boolean
      time: number
    }>(),

    cachedScrollTops: new Map<string, number>(),

    paidRequired: false,
    announcePaidGroupRequired: false,

    get isActive() {
      return !!this.id;
    },

    get objectTotal() {
      return this.postIds.length;
    },

    get objects() {
      return this.postIds
        .map((idId) => this.postMap[idId]);
    },

    get frontPost() {
      if (this.postIds.length === 0) {
        return null;
      }
      return this.postMap[this.postIds[0]];
    },

    get rearPost() {
      return this.postMap[this.postIds[this.postIds.length - 1]];
    },

    setId(id: string) {
      if (this.id === id) {
        return;
      }
      this.cacheGroupObjects();
      this.id = id;
    },

    clearPosts() {
      runInAction(() => {
        this.postIdSet = new Set();
        this.postIds = [];
        this.postMap = {};
        this.profileMap = {};
        this.hasMorePosts = false;
      });
    },

    clearAfterGroupChanged() {
      runInAction(() => {
        this.latestPostTimeStampSet.clear();
        this.firstFrontHistoricalObjectId = '';
        this.profile = {} as IDBProfile;
        this.searchActive = false;
        this.searchText = '';
        this.paidRequired = false;
        this.announcePaidGroupRequired = false;
      });
    },

    addPost(
      object: IDBPost,
      options: {
        isFront?: boolean
      } = {},
    ) {
      runInAction(() => {
        if (object.groupId !== this.id) {
          return;
        }
        if (this.postIdSet.has(object.id)) {
          return;
        }
        if (options.isFront) {
          const frontHistoricalObjectIds = this.postIds.filter((id) => object.timestamp < this.postMap[id].timestamp);
          const frontHistoricalObjectCount = frontHistoricalObjectIds.length;
          if (frontHistoricalObjectCount > 0) {
            if (!this.firstFrontHistoricalObjectId) {
              this.firstFrontHistoricalObjectId = frontHistoricalObjectIds[frontHistoricalObjectCount - 1];
            }
            this.postIds.splice(frontHistoricalObjectCount, 0, object.id);
          } else {
            this.postIds.unshift(object.id);
          }
        } else {
          this.postIds.push(object.id);
        }
        this.postIdSet.add(object.id);
        this.postMap[object.id] = object;
        this.profileMap[object.publisher] = object.extra.user;
      });
    },

    updatePost(id: string, object: IDBPost) {
      this.postMap[id] = object;
    },

    addPostToMap(id: string, object: IDBPost) {
      this.postMap[id] = object;
    },

    markAsSynced(id: string) {
      this.postMap[id].status = ContentStatus.synced;
    },

    deletePosts(ids: string[]) {
      runInAction(() => {
        for (const id of ids) {
          this.postIdSet.delete(id);
          this.postIds = this.postIds.filter(
            (v) => v !== id,
          );
          delete this.postMap[id];
        }
      });
    },

    deletePost(id: string) {
      this.deletePosts([id]);
    },

    cacheGroupObjects() {
      this.cachedGroupObjects.set(this.id, {
        objectTrxIdSet: this.postIdSet,
        objectTrxIds: this.postIds,
        objectMap: this.postMap,
        profileMap: this.profileMap,
        hasMoreObjects: this.hasMorePosts,
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
        this.postIdSet = cache.objectTrxIdSet;
        this.postIds = cache.objectTrxIds;
        this.postMap = cache.objectMap;
        this.profileMap = cache.profileMap;
        this.hasMorePosts = cache.hasMoreObjects;
        this.clearCache(id);
      }
      return !!cache;
    },

    clearCache(id: string) {
      this.cachedGroupObjects.delete(id);
      this.cachedScrollTops.delete(id);
    },

    getCachedObject(groupId: string, id: string) {
      const cachedGroup = this.cachedGroupObjects.get(groupId);
      return cachedGroup ? cachedGroup.objectMap[id] : null;
    },

    addLatestObjectTimeStamp(timestamp: number) {
      this.latestPostTimeStampSet.add(timestamp);
    },

    setMainLoading(value: boolean) {
      this.mainLoading = value;
    },

    setSwitchLoading(value: boolean) {
      this.switchLoading = value;
    },

    setHasMorePosts(value: boolean) {
      this.hasMorePosts = value;
    },

    setProfile(profile: IDBProfile) {
      this.profile = profile;
    },

    updateProfileMap(publisher: string, profile: IDBProfile) {
      if (this.profileMap[publisher]) {
        Object.assign(this.profileMap[publisher], profile);
      }
    },

    tryUpdateCachedProfileMap(groupId: string, publisher: string, profile: IDBProfile) {
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

    setPostsFilter(objectsFilter: IObjectsFilter) {
      this.objectsFilter = objectsFilter;
    },

    setPaidRequired(value: boolean) {
      this.paidRequired = value;
    },

    setAnouncePaidGroupRequired(value: boolean) {
      this.announcePaidGroupRequired = value;
    },

    truncateObjects(fromTimeStamp?: number) {
      const removedIds = fromTimeStamp ? this.postIds.filter((id) => this.postMap[id].timestamp <= fromTimeStamp) : this.postIds.slice(30);
      this.deletePosts(removedIds);
    },
  };
}
