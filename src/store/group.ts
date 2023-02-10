import GroupApi, { GroupStatus, IGroup } from 'apis/group';
import { observable, runInAction } from 'mobx';

export interface IProfile {
  name: string
  avatar: string
  mixinUID?: string
}

type IHasAnnouncedProducersMap = Record<string, boolean>;

export function createGroupStore() {
  return {
    map: {} as Record<string, IGroup>,

    latestTrxIdMap: '',

    lastReadTrxIdMap: '',

    hasAnnouncedProducersMap: {} as IHasAnnouncedProducersMap,

    get ids() {
      return Object.keys(this.map);
    },

    get groups() {
      return Object.values(this.map);
    },

    get ownGroups() {
      return this.groups.filter((group) => group.owner_pubkey === group.user_pubkey);
    },

    get notOwnGroups() {
      return this.groups.filter((group) => group.owner_pubkey !== group.user_pubkey);
    },

    hasGroup(id: string) {
      return id in this.map;
    },

    addGroups(groups: IGroup[] = []) {
      groups.forEach((newGroup) => {
        // update existing group
        if (newGroup.group_id in this.map) {
          this.updateGroup(newGroup.group_id, newGroup);
          return;
        }

        // add new group
        this.map[newGroup.group_id] = observable(newGroup);
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

    syncGroup(groupId: string) {
      const group = this.map[groupId];

      if (!group) {
        throw new Error(`group ${groupId} not found in map`);
      }

      if (group.group_status === GroupStatus.SYNCING) {
        return;
      }

      try {
        this.updateGroup(groupId, {
          group_status: GroupStatus.SYNCING,
        });
        GroupApi.syncGroup(groupId);
      } catch (e) {
        console.log(e);
      }
    },

    setHasAnnouncedProducersMap(groupId: string, value: boolean) {
      this.hasAnnouncedProducersMap[groupId] = value;
    },
  };
}
