import { IGroup } from 'apis/group';
import Store from 'electron-store';
import { ContentStatus } from 'store/database';

interface LastReadContentTrxIdMap {
  [key: string]: number;
}

interface ILatestStatusMap {
  [key: string]: ILatestStatus;
}

export interface ILatestStatus {
  latestTrxId?: string;
  latestTimeStamp?: number;
  latestReadTimeStamp?: number;
  unreadCount?: number;
}

export function createGroupStore() {
  let electronStore: Store;

  return {
    ids: <string[]>[],

    map: <{ [key: string]: IGroup }>{},

    latestObjectTimeStampMap: {} as LastReadContentTrxIdMap,

    unReadCountMap: {} as any,

    electronStoreName: '',

    latestTrxIdMap: '',

    lastReadTrxIdMap: '',

    latestStatusMap: {} as ILatestStatusMap,

    get groups() {
      return this.ids
        .map((id: any) => this.map[id])
        .sort((a, b) => b.LastUpdate - a.LastUpdate);
    },

    initElectronStore(name: string) {
      electronStore = new Store({
        name,
      });
      this.electronStoreName = name;
      this._syncFromElectronStore();
    },

    addGroups(groups: IGroup[] = []) {
      for (const group of groups) {
        if (!this.map[group.GroupId]) {
          this.ids.unshift(group.GroupId);
        }
        this.map[group.GroupId] = group;
      }
    },

    updateGroup(id: string, updatedGroup: IGroup) {
      const group = this.map[id];
      group.LastUpdate = updatedGroup.LastUpdate;
      group.LatestBlockNum = updatedGroup.LatestBlockNum;
      group.LatestBlockId = updatedGroup.LatestBlockId;
      group.GroupStatus = updatedGroup.GroupStatus;
    },

    deleteGroup(id: string) {
      this.ids = this.ids.filter((_id) => _id !== id);
      delete this.map[id];
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

    updateUnReadCountMap(groupId: string, count: number) {
      this.unReadCountMap[groupId] = count;
    },

    updateLatestStatusMap(groupId: string, data: ILatestStatus) {
      const map = this.latestStatusMap[groupId];
      this.latestStatusMap[groupId] = {
        ...(map ? map : {}),
        ...data,
      };
      electronStore.set('latestStatusMap', this.latestStatusMap);
    },

    _syncFromElectronStore() {
      this.latestObjectTimeStampMap = (electronStore.get(
        'latestObjectTimeStampMap'
      ) || {}) as LastReadContentTrxIdMap;
      this.latestStatusMap = (electronStore.get('latestStatusMap') ||
        {}) as ILatestStatusMap;
    },
  };
}
