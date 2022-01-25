import GroupApi, { GroupStatus, IGroup } from 'apis/group';
import { observable, runInAction } from 'mobx';
import * as PersonModel from 'hooks/useDatabase/models/person';
import Database from 'hooks/useDatabase/database';

type IHasAnnouncedProducersMap = Record<string, boolean>;

export function createGroupStore() {
  return {
    map: {} as Record<string, IGroup>,

    configMap: new Map<string, Record<string, number | string | boolean>>(),

    latestTrxIdMap: '',

    lastReadTrxIdMap: '',

    hasAnnouncedProducersMap: {} as IHasAnnouncedProducersMap,

    myInitObjectCountMap: {} as Record<string, number>,

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
        if (newGroup.group_id in this.map) {
          this.updateGroup(newGroup.group_id, newGroup);
          return;
        }

        this.map[newGroup.group_id] = observable(newGroup);
      });
    },

    appendProfile(db: Database) {
      this.groups.forEach(async (group) => {
        const result = await PersonModel.getLatestProfile(db, {
          GroupId: group.group_id,
          Publisher: group.user_pubkey,
        });
        if (result) {
          group.profile = result.profile;
          group.profileTag = result.profile.name + result.profile.avatar;
          group.profileStatus = result.status;
        } else {
          group.profileTag = '';
        }
        this.updateGroup(group.group_id, group);
      });
    },

    async updateProfile(db: Database, groupId: string) {
      const group = this.map[groupId];
      if (!group) {
        return;
      }
      const result = await PersonModel.getLatestProfile(db, {
        GroupId: group.group_id,
        Publisher: group.user_pubkey,
      });
      if (!result) {
        return;
      }
      group.profile = result.profile;
      group.profileTag = result.profile.name + result.profile.avatar;
      group.profileStatus = result.status;
      this.updateGroup(group.group_id, group);
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

    updateGroupConfig(groupId: string, config: Record<string, string | boolean | number>) {
      this.configMap.set(groupId, config);
    },

    deleteGroup(id: string) {
      delete this.map[id];
      this.configMap.delete(id);
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

    setMyInitObjectCountMap(groupId: string, count: number) {
      this.myInitObjectCountMap[groupId] = count;
    },
  };
}
