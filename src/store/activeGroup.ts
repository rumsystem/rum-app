import { runInAction } from 'mobx';
import { IGroup, ContentTypeUrl, IPerson } from 'apis/group';
import Database, {
  IDbDerivedObjectItem,
  ContentStatus,
  IDbPersonItem,
} from 'store/database';
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
  return {
    loading: false,

    id: '',

    ids: <string[]>[],

    map: <{ [key: string]: IGroup }>{},

    hasMoreObjects: false,

    objectTrxIdSet: new Set(),

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

    get objects() {
      return this.objectTrxIds.map((trxId: any) => this.objectMap[trxId]);
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
        this._objectTrxIds = [];
        this.objectMap = {};
      });
    },

    clearAfterGroupChanged() {
      runInAction(() => {
        this.objectTrxIdSet.clear();
        this._objectTrxIds = [];
        this.objectMap = {};
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
        this.tryMarkTimeoutObject(object);
        if (options.isFront) {
          this._objectTrxIds.unshift(object.TrxId);
        } else {
          this._objectTrxIds.push(object.TrxId);
        }
        this.objectTrxIdSet.add(object.TrxId);
        this.objectMap[object.TrxId] = object;
      });
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
      runInAction(() => {
        this.objectTrxIdSet.delete(trxId);
        this._objectTrxIds = this._objectTrxIds.filter(
          (_txId) => _txId !== trxId
        );
        delete this.objectMap[trxId];
      });
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

    setHasMoreObjects(value: boolean) {
      this.hasMoreObjects = value;
    },

    async fetchPerson(data: { groupId: string; publisher: string }) {
      try {
        const person = await new Database().persons
          .where({
            GroupId: data.groupId,
            Publisher: data.publisher,
          })
          .last();
        this.person = person || null;
      } catch (err) {
        console.log(err);
      }
    },

    async savePerson(data: {
      groupId: string;
      publisher: string;
      trxId: string;
      person: IPerson;
    }) {
      try {
        const person = {
          GroupId: data.groupId,
          TrxId: data.trxId,
          Publisher: data.publisher,
          Content: data.person,
          TypeUrl: ContentTypeUrl.Person,
          TimeStamp: Date.now() * 1000000,
          Status: ContentStatus.Syncing,
        };
        await new Database().persons.add(person);
        this.person = person;
      } catch (err) {
        console.log(err);
      }
    },

    async fetchFollowings(data: { groupId: string; publisher: string }) {
      const follows = await new Database().follows
        .where({
          GroupId: data.groupId,
          Publisher: data.publisher,
        })
        .toArray();
      this.followingSet = new Set(follows.map((follow) => follow.Following));
    },

    async addFollowing(data: {
      groupId: string;
      publisher: string;
      following: string;
    }) {
      try {
        const follow = {
          GroupId: data.groupId,
          TrxId: '',
          Publisher: data.publisher,
          Content: {
            following: data.following,
          },
          Following: data.following,
          TypeUrl: ContentTypeUrl.Follow,
          TimeStamp: Date.now() * 1000000,
          Status: ContentStatus.Syncing,
        };
        await new Database().follows.add(follow);
        this.followingSet.add(data.following);
      } catch (err) {
        console.log(err);
      }
    },

    async deleteFollowing(data: {
      groupId: string;
      publisher: string;
      following: string;
    }) {
      try {
        await new Database().follows
          .where({
            GroupId: data.groupId,
            Publisher: data.publisher,
            Following: data.following,
          })
          .delete();
        this.followingSet.delete(data.following);
      } catch (err) {
        console.log(err);
      }
    },
  };
}
