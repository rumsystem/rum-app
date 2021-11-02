import { IGroup, ICreateGroupsResult } from 'apis/group';
import Store from 'electron-store';

interface LastReadContentTrxIdMap {
  [key: string]: number;
}

export enum Status {
  PUBLISHED,
  PUBLISHING,
  FAILED,
}

export function createGroupStore() {
  let electronStore: Store;

  return {
    ids: <string[]>[],

    map: <{ [key: string]: IGroup }>{},

    latestContentTimeStampMap: {} as LastReadContentTrxIdMap,

    unReadCountMap: {} as any,

    electronStoreName: '',

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
      this.latestContentTimeStampMap[groupId] = timeStamp;
      electronStore.set(
        'latestContentTimeStampMap',
        this.latestContentTimeStampMap
      );
    },

    updateUnReadCountMap(groupId: string, count: number) {
      this.unReadCountMap[groupId] = count;
    },

    addSeed(id: string, group: ICreateGroupsResult) {
      electronStore.set(`group_seed_${id}`, group);
    },

    getSeed(id: string) {
      return electronStore.get(`group_seed_${id}`);
    },

    deleteSeed(id: string) {
      electronStore.delete(`group_seed_${id}`);
    },

    _syncFromElectronStore() {
      this.latestContentTimeStampMap = (electronStore.get(
        'latestContentTimeStampMap'
      ) || {}) as LastReadContentTrxIdMap;
    },
  };
}
