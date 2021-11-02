import { IGroup } from 'apis/group';
import Store from 'electron-store';
import { runInAction } from 'mobx';

interface LastReadContentTrxIdMap {
  [key: string]: number;
}

interface ILatestStatusMap {
  [key: string]: ILatestStatus | null;
}

export interface IProfile {
  name: string;
  avatar: string;
}

export interface ILatestStatus {
  latestTrxId: string;
  latestTimeStamp: number;
  latestReadTimeStamp: number;
  unreadCount: number;
}

export interface ILatestStatusPayload {
  latestTrxId?: string;
  latestTimeStamp?: number;
  latestReadTimeStamp?: number;
  unreadCount?: number;
}

export const DEFAULT_LATEST_STATUS = {
  latestTrxId: '',
  latestTimeStamp: 0,
  latestReadTimeStamp: 0,
  unreadCount: 0,
};

export function createGroupStore() {
  let electronStore: Store;

  return {
    ids: <string[]>[],

    map: <{ [key: string]: IGroup }>{},

    latestObjectTimeStampMap: {} as LastReadContentTrxIdMap,

    electronStoreName: '',

    latestTrxIdMap: '',

    lastReadTrxIdMap: '',

    latestStatusMap: {} as ILatestStatusMap,

    profileAppliedToAllGroups: null as IProfile | null,

    get groups() {
      return this.ids
        .map((id: any) => this.map[id])
        .sort((a, b) => {
          return (
            (this.latestStatusMap[b.GroupId] || DEFAULT_LATEST_STATUS)
              .latestTimeStamp -
            (this.latestStatusMap[a.GroupId] || DEFAULT_LATEST_STATUS)
              .latestTimeStamp
          );
        });
    },

    initElectronStore(name: string) {
      electronStore = new Store({
        name,
      });
      this.electronStoreName = name;
      this._syncFromElectronStore();
    },

    addGroups(groups: IGroup[] = []) {
      runInAction(() => {
        for (const group of groups) {
          if (!this.map[group.GroupId]) {
            this.ids.unshift(group.GroupId);
          }
          this.map[group.GroupId] = group;
        }
      });
    },

    updateGroup(id: string, updatedGroup: IGroup) {
      runInAction(() => {
        const group = this.map[id];
        group.LastUpdate = updatedGroup.LastUpdate;
        group.LatestBlockNum = updatedGroup.LatestBlockNum;
        group.LatestBlockId = updatedGroup.LatestBlockId;
        group.GroupStatus = updatedGroup.GroupStatus;
      });
    },

    deleteGroup(id: string) {
      runInAction(() => {
        this.ids = this.ids.filter((_id) => _id !== id);
        delete this.map[id];
      });
    },

    getStatusText(group: IGroup) {
      const statusMap = {
        GROUP_READY: '已同步',
        GROUP_SYNCING: '同步中',
      };
      return statusMap[group.GroupStatus];
    },

    resetElectronStore() {
      if (!electronStore) {
        return;
      }
      electronStore.clear();
    },

    setLatestContentTimeStamp(groupId: string, timeStamp: number) {
      this.latestObjectTimeStampMap[groupId] = timeStamp;
      electronStore.set(
        'latestObjectTimeStampMap',
        this.latestObjectTimeStampMap
      );
    },

    updateLatestStatusMap(groupId: string, data: ILatestStatusPayload) {
      this.latestStatusMap[groupId] = {
        ...(this.latestStatusMap[groupId] || DEFAULT_LATEST_STATUS),
        ...data,
      };
      electronStore.set('latestStatusMap', this.latestStatusMap);
    },

    setProfileAppliedToAllGroups(profile: IProfile) {
      this.profileAppliedToAllGroups = profile;
      electronStore.set(
        'profileAppliedToAllGroups',
        this.profileAppliedToAllGroups
      );
    },

    _syncFromElectronStore() {
      this.latestObjectTimeStampMap = (electronStore.get(
        'latestObjectTimeStampMap'
      ) || {}) as LastReadContentTrxIdMap;
      this.latestStatusMap = (electronStore.get('latestStatusMap') ||
        {}) as ILatestStatusMap;
      this.profileAppliedToAllGroups = (electronStore.get(
        'profileAppliedToAllGroups'
      ) || null) as IProfile | null;
    },
  };
}
