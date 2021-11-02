import GroupApi, { GroupStatus, IGroup } from 'apis/group';
import { observable, runInAction, when } from 'mobx';

export interface IProfile {
  name: string
  avatar: string
  mixinUID?: string
}


type GroupMapItem = IGroup & {
  /** 是否显示同步状态 */
  showSync: boolean
};

export function createGroupStore() {
  return {
    map: {} as Record<string, GroupMapItem>,

    latestTrxIdMap: '',

    lastReadTrxIdMap: '',

    get ids() {
      return Object.keys(this.map);
    },

    get groups() {
      return Object.values(this.map);
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
      });
    },

    getStatusText(group: IGroup) {
      const statusMap = {
        GROUP_READY: '已同步',
        GROUP_SYNCING: '同步中',
      };
      return statusMap[group.GroupStatus];
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
  };
}
