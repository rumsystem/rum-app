import GroupApi, { GroupStatus, IGroup } from 'apis/group';
import { observable, runInAction } from 'mobx';
import * as PersonModel from 'hooks/useDatabase/models/person';
import Database from 'hooks/useDatabase/database';
import getProfile from 'store/selectors/getProfile';
import { isGroupOwner } from 'store/selectors/group';

type IHasAnnouncedProducersMap = Record<string, boolean>;

export function createGroupStore() {
  return {
    map: {} as Record<string, IGroup>,

    configMap: new Map<string, Record<string, number | string | boolean>>(),

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
      return this.groups.filter(isGroupOwner);
    },

    get notOwnGroups() {
      return this.groups.filter((group) => !isGroupOwner(group));
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
        if ('profileTag' in group) {
          return;
        }
        const result = await PersonModel.getLatestProfile(db, {
          GroupId: group.group_id,
          Publisher: group.user_pubkey,
        });
        if (result) {
          group.profile = result.profile;
          group.profileTag = result.profile.name + result.profile.avatar;
          group.profileStatus = result.status;
          group.person = result.person;
        } else {
          const defaultProfile = getProfile(group.user_pubkey);
          group.profile = defaultProfile;
          group.profileTag = defaultProfile.name + defaultProfile.avatar;
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
      if (result) {
        group.profile = result.profile;
        group.profileTag = result.profile.name + result.profile.avatar;
        group.profileStatus = result.status;
        group.person = result.person;
      } else {
        const defaultProfile = getProfile(group.user_pubkey);
        group.profile = defaultProfile;
        group.profileTag = defaultProfile.name + defaultProfile.avatar;
      }
      this.updateGroup(group.group_id, group, true);
    },

    updateGroup(
      id: string,
      updatedGroup: Partial<IGroup & { backgroundSync: boolean }>,
      triggleAction?: boolean,
    ) {
      if (!(id in this.map)) {
        throw new Error(`group ${id} not found in map`);
      }
      runInAction(() => {
        const group = this.map[id];
        if (group) {
          const newGroup = { ...group, ...updatedGroup };
          if (triggleAction) {
            this.map[newGroup.group_id] = observable(newGroup);
          } else {
            Object.assign(group, newGroup);
          }
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
  };
}
