import { runInAction } from 'mobx';
import { IGroup } from 'apis/group';
import {
  IDbDerivedObjectItem,
  ContentStatus,
  IDbPersonItem,
} from 'hooks/useDatabase';
import { OffChainDatabase } from 'hooks/useOffChainDatabase';

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
  return {
    mainLoading: false,

    switchLoading: false,

    id: '',

    ids: <string[]>[],

    map: <{ [key: string]: IGroup }>{},

    hasMoreObjects: false,

    objectTrxIdSet: new Set(),

    objectTrxIds: [] as string[],

    objectMap: <{ [key: string]: IDbDerivedObjectItem }>{},

    latestObjectTimeStampSet: new Set(),

    filterType: FilterType.ALL,

    filterUserIdSet: new Set() as Set<string>,

    electronStoreName: '',

    followingSet: new Set(),

    person: null as IDbPersonItem | null,

    personMap: <{ [key: string]: IDbPersonItem }>{},

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
      return this.objectMap[this.objectTrxIds[0]];
    },

    get rearObject() {
      return this.objectMap[this.objectTrxIds[this.objectTrxIds.length - 1]];
    },

    get followings() {
      return Array.from(this.followingSet) as string[];
    },

    get isFilterAll() {
      return this.filterType === FilterType.ALL;
    },

    setId(id: string) {
      if (this.id === id) {
        return;
      }
      this.id = id;
      this.clearAfterGroupChanged();
    },

    clearObjects() {
      runInAction(() => {
        this.objectTrxIdSet.clear();
        this.objectTrxIds = [];
        this.objectMap = {};
        this.personMap = {};
        this.hasMoreObjects = false;
      });
    },

    clearAfterGroupChanged() {
      runInAction(() => {
        this.clearObjects();
        this.latestObjectTimeStampSet.clear();
        this.filterType = FilterType.ALL;
        this.person = null;
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
        if (object.Person) {
          this.personMap[object.Publisher] = object.Person;
          object.Person = null;
        }
      });
    },

    markSyncedObject(trxId: string) {
      this.objectMap[trxId].Status = ContentStatus.Synced;
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

    addLatestContentTimeStamp(timestamp: number) {
      this.latestObjectTimeStampSet.add(timestamp);
    },

    setFilterType(filterType: FilterType) {
      if (this.filterType === filterType) {
        return;
      }
      runInAction(() => {
        this.filterType = filterType;
        this.clearObjects();
      });
    },

    setFilterUserIdSet(userIds: string[]) {
      this.filterUserIdSet = new Set(userIds);
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

    setPerson(person: IDbPersonItem) {
      this.person = person;
    },

    async fetchFollowings(options: {
      offChainDatabase: OffChainDatabase;
      groupId: string;
      publisher: string;
    }) {
      const follows = await options.offChainDatabase.follows
        .where({
          GroupId: options.groupId,
          Publisher: options.publisher,
        })
        .toArray();
      this.followingSet = new Set(follows.map((follow) => follow.Following));
    },

    async addFollowing(options: {
      offChainDatabase: OffChainDatabase;
      groupId: string;
      publisher: string;
      following: string;
    }) {
      try {
        const follow = {
          GroupId: options.groupId,
          Publisher: options.publisher,
          Following: options.following,
          TimeStamp: Date.now() * 1000000,
        };
        await options.offChainDatabase.follows.add(follow);
        this.followingSet.add(options.following);
      } catch (err) {
        console.log(err);
      }
    },

    async deleteFollowing(options: {
      offChainDatabase: OffChainDatabase;
      groupId: string;
      publisher: string;
      following: string;
    }) {
      try {
        await options.offChainDatabase.follows
          .where({
            GroupId: options.groupId,
            Publisher: options.publisher,
            Following: options.following,
          })
          .delete();
        this.followingSet.delete(options.following);
      } catch (err) {
        console.log(err);
      }
    },
  };
}
