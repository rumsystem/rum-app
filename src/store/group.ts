import GroupApi, { GroupStatus, IGroup } from 'apis/group';
import Store from 'electron-store';
import { action, observable, runInAction, when } from 'mobx';
import { sleep } from 'utils';

export interface ILatestStatusMap {
  [key: string]: ILatestStatus | null;
}

export interface IDraftMap {
  [key: string]: string;
}

export interface IProfile {
  name: string;
  avatar: string;
}

export interface ILatestStatus {
  latestTrxId: string;
  latestTimeStamp: number;
  latestObjectTimeStamp: number;
  latestReadTimeStamp: number;
  unreadCount: number;
}

export interface ILatestStatusPayload {
  latestTrxId?: string;
  latestTimeStamp?: number;
  latestObjectTimeStamp?: number;
  latestReadTimeStamp?: number;
  unreadCount?: number;
}

export const DEFAULT_LATEST_STATUS = {
  latestTrxId: '',
  latestTimeStamp: 0,
  latestObjectTimeStamp: 0,
  latestReadTimeStamp: 0,
  unreadCount: 0,
};

export function createGroupStore() {
  let electronStore: Store;

  return {
    ids: <string[]>[],

    map: {} as { [key: string]: IGroup & {
      firstSyncDone: boolean
    } },

    electronStoreName: '',

    latestTrxIdMap: '',

    lastReadTrxIdMap: '',

    latestStatusMap: {} as ILatestStatusMap,

    profileAppliedToAllGroups: null as IProfile | null,

    draftMap: {} as IDraftMap,

    get groups() {
      return this.ids
        .map((id: any) => this.map[id])
        .sort((a, b) => {
          const aTimeStamp = (
            this.latestStatusMap[a.GroupId] || DEFAULT_LATEST_STATUS
          ).latestObjectTimeStamp;
          const bTimeStamp = (
            this.latestStatusMap[b.GroupId] || DEFAULT_LATEST_STATUS
          ).latestObjectTimeStamp;
          if (aTimeStamp === 0) {
            return 1;
          }
          return bTimeStamp - aTimeStamp;
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
          const newGroup = observable({
            ...group,
            firstSyncDone: false,
          })
          this.map[group.GroupId] = newGroup;

          // trigger first sync
          if (newGroup.GroupStatus === GroupStatus.GROUP_READY) {
            this.syncGroup(newGroup.GroupId)
          }
          // wait until first sync
          when(() => newGroup.GroupStatus == GroupStatus.GROUP_SYNCING)
            .then(() => when(() => newGroup.GroupStatus == GroupStatus.GROUP_READY))
            .then(action(() => {
              newGroup.firstSyncDone = true;
            }));
        }
      });
    },

    updateGroup(id: string, updatedGroup: Partial<IGroup & { backgroundSync: boolean }>) {
      if (!(id in this.map)) {
        throw new Error(`group ${id} not found in map`);
      }
      runInAction(() => {
        const group = this.map[id];
        if (group) {
          const newGroup = Object.assign({}, group, updatedGroup)
          Object.assign(group, newGroup)
        }
      });
    },

    deleteGroup(id: string) {
      runInAction(() => {
        this.ids = this.ids.filter((_id) => _id !== id);
        delete this.map[id];
        delete this.latestStatusMap[id];
        electronStore.set('latestStatusMap', this.latestStatusMap);
        delete this.draftMap[id];
        electronStore.set('draftMap', this.draftMap);
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

    updateLatestStatusMap(groupId: string, data: ILatestStatusPayload) {
      this.latestStatusMap[groupId] = {
        ...(this.latestStatusMap[groupId] || DEFAULT_LATEST_STATUS),
        ...data,
      };
      electronStore.set('latestStatusMap', this.latestStatusMap);
    },

    updateDraftMap(groupId: string, content: string) {
      this.draftMap[groupId] = content;
      electronStore.set('draftMap', this.draftMap);
    },

    setProfileAppliedToAllGroups(profile: IProfile) {
      this.profileAppliedToAllGroups = profile;
      electronStore.set(
        'profileAppliedToAllGroups',
        this.profileAppliedToAllGroups
      );
    },

    async syncGroup(groupId: string) {
      const group = this.map[groupId]

      if (group.GroupStatus === GroupStatus.GROUP_SYNCING) {
        return;
      }

      if (!group) {
        throw new Error(`group ${groupId} not found in map`);
      }

      try {
        this.updateGroup(groupId, {
          GroupStatus: GroupStatus.GROUP_SYNCING,
        });
        await GroupApi.syncGroup(groupId);
      } catch (e) {
        console.log(e)
      }
    },

    _syncFromElectronStore() {
      this.latestStatusMap = (electronStore.get('latestStatusMap') ||
        {}) as ILatestStatusMap;
      this.profileAppliedToAllGroups = (electronStore.get(
        'profileAppliedToAllGroups'
      ) || null) as IProfile | null;
      this.draftMap = (electronStore.get('draftMap') || {}) as IDraftMap;
    },
  };
}
