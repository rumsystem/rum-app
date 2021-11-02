import { runInAction } from 'mobx';
import { IGroup, ContentTypeUrl, IPerson } from 'apis/group';
import Database, {
  IDbDerivedObjectItem,
  ContentStatus,
  IDbPersonItem,
} from 'store/database';
import OffChainDatabase from 'store/offChainDatabase';
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
    mainLoading: false,

    switchLoading: false,

    id: '',

    ids: <string[]>[],

    map: <{ [key: string]: IGroup }>{},

    hasMoreObjects: false,

    objectTrxIdSet: new Set(),

    objectTrxIds: [] as string[],

    objectMap: <{ [key: string]: IDbDerivedObjectItem }>{},

    timeoutObjectSet: new Set(),

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
        this.tryMarkTimeoutObject(object);
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
        this.setPerson(person);
      } catch (err) {
        console.log(err);
      }
    },

    setPerson(person: IDbPersonItem) {
      this.person = person;
    },

    async fetchFollowings(data: { groupId: string; publisher: string }) {
      const follows = await new OffChainDatabase().follows
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
          Publisher: data.publisher,
          Following: data.following,
          TimeStamp: Date.now() * 1000000,
        };
        await new OffChainDatabase().follows.add(follow);
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
        await new OffChainDatabase().follows
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
