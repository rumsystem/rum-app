import { IGroup } from 'apis/group';
import { observable, runInAction } from 'mobx';
import * as ProfileModel from 'hooks/useDatabase/models/profile';
import Database from 'hooks/useDatabase/database';
import { isGroupOwner } from 'store/selectors/group';

type IHasAnnouncedProducersMap = Record<string, boolean>;

export function createGroupStore() {
  return {
    map: {} as Record<string, IGroup>,
    profileMap: {} as Record<string, ProfileModel.IDBProfile | undefined>,
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
        if (this.profileMap[group.group_id]) {
          return;
        }
        const result = await ProfileModel.get(db, {
          groupId: group.group_id,
          publisher: group.user_pubkey,
          useFallback: true,
        });
        this.profileMap[group.group_id] = result;
        this.updateGroup(group.group_id, group);
      });
    },

    async updateProfile(db: Database, groupId: string) {
      const group = this.map[groupId];
      if (!group) { return; }
      const result = await ProfileModel.get(db, {
        groupId: group.group_id,
        publisher: group.user_pubkey,
        useFallback: true,
      });
      this.profileMap[group.group_id] = result;
      this.updateGroup(group.group_id, group, true);
    },

    setProfile(profile: ProfileModel.IDBProfile) {
      this.profileMap[profile.groupId] = profile;
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

    setHasAnnouncedProducersMap(groupId: string, value: boolean) {
      this.hasAnnouncedProducersMap[groupId] = value;
    },

    setMyInitObjectCountMap(groupId: string, count: number) {
      this.myInitObjectCountMap[groupId] = count;
    },
  };
}
