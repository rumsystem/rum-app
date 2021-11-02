import { runInAction } from 'mobx';
import { ContentStatus } from 'hooks/useDatabase';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import * as UnFollowingModel from 'hooks/useOffChainDatabase/models/unFollowing';
import { OffChainDatabase } from 'hooks/useOffChainDatabase';
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

interface IObjectsFilter {
  type: ObjectsFilterType;
  publisher?: string;
}

export function createActiveGroupStore() {
  return {
    mainLoading: false,

    switchLoading: false,

    id: '',

    hasMoreObjects: false,

    objectTrxIdSet: new Set(),

    objectTrxIds: [] as string[],

    objectMap: <{ [key: string]: IDbDerivedObjectItem }>{},

    latestObjectTimeStampSet: new Set(),

    objectsFilter: {
      type: ObjectsFilterType.ALL,
      publisher: '',
    } as IObjectsFilter,

    electronStoreName: '',

    unFollowingSet: new Set() as Set<string>,

    profile: {} as IProfile,

    profileMap: <{ [key: string]: IProfile }>{},

    searchActive: false,

    searchText: '',

    get isActive() {
      return !!this.id;
    },

    get objectTotal() {
      return this.objectTrxIds.length;
    },

    get objects() {
      return this.objectTrxIds.map((trxId: any) => this.objectMap[trxId]);
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
      this.id = id;
    },

    clearObjects() {
      runInAction(() => {
        this.objectTrxIdSet.clear();
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
        isFront?: boolean;
      } = {}
    ) {
      runInAction(() => {
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
        if (object.Extra.user.profile) {
          this.profileMap[object.Publisher] = object.Extra.user.profile;
        }
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
          (_txId) => _txId !== trxId
        );
        delete this.objectMap[trxId];
      });
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

    async fetchUnFollowings(
      offChainDatabase: OffChainDatabase,
      options: {
        groupId: string;
        publisher: string;
      }
    ) {
      const unFollowings = await UnFollowingModel.list(offChainDatabase, {
        GroupId: options.groupId,
      });
      this.unFollowingSet = new Set(
        unFollowings.map((unFollowing) => unFollowing.Publisher)
      );
    },

    async unFollow(
      offChainDatabase: OffChainDatabase,
      options: {
        groupId: string;
        publisher: string;
      }
    ) {
      try {
        const unFollowing = {
          GroupId: options.groupId,
          Publisher: options.publisher,
          TimeStamp: Date.now() * 1000000,
        };
        await UnFollowingModel.create(offChainDatabase, unFollowing);
        this.unFollowingSet.add(options.publisher);
      } catch (err) {
        console.log(err);
      }
    },

    async follow(
      offChainDatabase: OffChainDatabase,
      options: {
        groupId: string;
        publisher: string;
      }
    ) {
      try {
        await UnFollowingModel.remove(offChainDatabase, {
          GroupId: options.groupId,
          Publisher: options.publisher,
        });
        this.unFollowingSet.delete(options.publisher);
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
  };
}
