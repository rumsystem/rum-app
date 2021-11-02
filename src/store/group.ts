import GroupApi, { GroupStatus, IGroup } from 'apis/group';
import Store from 'electron-store';
import { observable, runInAction, when } from 'mobx';
import type * as NotificationModel from 'hooks/useDatabase/models/notification';

export type ILatestStatusMap = Record<string, ILatestStatus | null>;

export type IDraftMap = Record<string, string>;

export interface IProfile {
  name: string
  avatar: string
  mixinUUID: string
}

export interface ILatestStatus {
  latestTrxId: string
  latestTimeStamp: number
  latestObjectTimeStamp: number
  latestReadTimeStamp: number
  unreadCount: number
  notificationUnreadCountMap: NotificationModel.IUnreadCountMap
}

export interface ILatestStatusPayload {
  latestTrxId?: string
  latestTimeStamp?: number
  latestObjectTimeStamp?: number
  latestReadTimeStamp?: number
  unreadCount?: number
  notificationUnreadCountMap?: NotificationModel.IUnreadCountMap
}

export const DEFAULT_LATEST_STATUS = {
  latestTrxId: '',
  latestTimeStamp: 0,
  latestObjectTimeStamp: 0,
  latestReadTimeStamp: 0,
  unreadCount: 0,
  notificationUnreadCountMap: {} as NotificationModel.IUnreadCountMap,
};

type GroupMapItem = IGroup & {
  /** 是否显示同步状态 */
  showSync: boolean
};

export function createGroupStore() {
  let electronStore: Store;

  return {
    map: {} as Record<string, GroupMapItem>,

    electronStoreName: '',

    latestTrxIdMap: '',

    lastReadTrxIdMap: '',

    latestStatusMap: {} as ILatestStatusMap,

    profileAppliedToAllGroups: null as IProfile | null,

    draftMap: {} as IDraftMap,

    get ids() {
      return Object.keys(this.map);
    },

    get groups() {
      return Object.values(this.map).sort((a, b) => {
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

    hasGroup(id: string) {
      return id in this.map;
    },

    addGroups(groups: IGroup[] = []) {
      const triggerFirstSync = async (group: GroupMapItem) => {
        // trigger first sync
        if (group.GroupStatus === GroupStatus.GROUP_READY) {
          this.syncGroup(group.GroupId);
        }
        // wait until first sync
        await when(() => group.GroupStatus === GroupStatus.GROUP_SYNCING);
        await when(() => group.GroupStatus === GroupStatus.GROUP_READY);
        runInAction(() => {
          group.showSync = false;
        });
      };

      groups.forEach((newGroup) => {
        // update existing group
        if (newGroup.GroupId in this.map) {
          this.updateGroup(newGroup.GroupId, newGroup);
          return;
        }

        // add new group
        this.map[newGroup.GroupId] = observable({
          ...newGroup,
          showSync: true,
        });

        triggerFirstSync(this.map[newGroup.GroupId]);
      });
    },

    updateGroup(
      id: string,
      updatedGroup: Partial<IGroup & { backgroundSync: boolean }>,
    ) {
      if (!(id in this.map)) {
        throw new Error(`group ${id} not found in map`);
      }
      runInAction(() => {
        const group = this.map[id];
        if (group) {
          const newGroup = { ...group, ...updatedGroup };
          Object.assign(group, newGroup);
        }
      });
    },

    deleteGroup(id: string) {
      runInAction(() => {
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
        ...this.latestStatusMap[groupId] || DEFAULT_LATEST_STATUS,
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
        this.profileAppliedToAllGroups,
      );
    },

    /**
     * @param manually - 只有 manually 的 sync 才会显示同步中状态
     */
    async syncGroup(groupId: string, manually = false) {
      const group = this.map[groupId];

      if (!group) {
        throw new Error(`group ${groupId} not found in map`);
      }

      if (manually) {
        group.showSync = true;
      }

      if (group.GroupStatus === GroupStatus.GROUP_SYNCING) {
        return;
      }

      try {
        this.updateGroup(groupId, {
          GroupStatus: GroupStatus.GROUP_SYNCING,
        });
        GroupApi.syncGroup(groupId);
        await when(() => group.GroupStatus === GroupStatus.GROUP_READY);
        runInAction(() => {
          group.showSync = false;
        });
      } catch (e) {
        console.log(e);
      }
    },

    _syncFromElectronStore() {
      this.latestStatusMap = (electronStore.get('latestStatusMap')
        || {}) as ILatestStatusMap;
      this.profileAppliedToAllGroups = (electronStore.get(
        'profileAppliedToAllGroups',
      ) || null) as IProfile | null;
      this.draftMap = (electronStore.get('draftMap') || {}) as IDraftMap;
    },
  };
}
