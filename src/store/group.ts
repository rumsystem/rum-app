import GroupApi, { GroupStatus, IGroup, GROUP_CONFIG_KEY, ISubGroupConfig } from 'apis/group';
import { observable, runInAction } from 'mobx';
import * as PersonModel from 'hooks/useDatabase/models/person';
import Database from 'hooks/useDatabase/database';
import getProfile from 'store/selectors/getProfile';
import { isGroupOwner } from 'store/selectors/group';
import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';

type IHasAnnouncedProducersMap = Record<string, boolean>;

export type IConfig = Record<string, number | string | boolean>;

export type IConfigMap = Record<string, IConfig>;

const CONFIG_MAP_STORE_KEY = 'configMap';

export function createGroupStore() {
  return {
    map: {} as Record<string, IGroup>,

    configMap: {} as IConfigMap,

    hasAnnouncedProducersMap: {} as IHasAnnouncedProducersMap,

    get ids() {
      return Object.keys(this.map);
    },

    get groups() {
      return Object.values(this.map);
    },

    get topIds() {
      return this.ids.filter((id) => !this.subToTopMap[id]);
    },

    get topGroups() {
      return this.topIds.map((topId) => this.map[topId]);
    },

    get topMap() {
      const map: Record<string, IGroup> = {};
      for (const topId of this.topIds) {
        map[topId] = this.map[topId];
      }
      return map;
    },

    get ownTopGroups() {
      return this.topGroups.filter(isGroupOwner);
    },

    get topToSubConfigMap() {
      const map: Record<string, ISubGroupConfig> = {};
      for (const [groupId, config] of Object.entries(this.configMap)) {
        for (const [key, value] of Object.entries(config)) {
          if (key === GROUP_CONFIG_KEY.GROUP_SUB_GROUP_CONFIG) {
            try {
              const subGroupConfig = JSON.parse(value as string) as ISubGroupConfig;
              map[groupId] = subGroupConfig;
            } catch (err) {
              console.log(err);
            }
          }
        }
      }
      return map;
    },

    get subToTopMap() {
      const map: Record<string, string> = {};
      for (const [topGroupId, subConfig] of Object.entries(this.topToSubConfigMap)) {
        for (const seed of Object.values(subConfig)) {
          map[seed.group_id] = topGroupId;
        }
      }
      return map;
    },

    init() {
      this.configMap = (ElectronCurrentNodeStore.getStore().get(CONFIG_MAP_STORE_KEY) || {}) as IConfigMap;
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
      this.topGroups.forEach(async (group) => {
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

    setConfigMap(data: ([string, IConfig])[]) {
      const map: IConfigMap = {};
      for (const [groupId, config] of data) {
        map[groupId] = config;
      }
      this.configMap = map;
      ElectronCurrentNodeStore.getStore().set(CONFIG_MAP_STORE_KEY, this.configMap);
    },

    updateGroupConfig(groupId: string, config: IConfig) {
      this.configMap[groupId] = config;
      ElectronCurrentNodeStore.getStore().set(CONFIG_MAP_STORE_KEY, this.configMap);
    },

    deleteGroup(id: string) {
      delete this.map[id];
      delete this.configMap[id];
      ElectronCurrentNodeStore.getStore().set(CONFIG_MAP_STORE_KEY, this.configMap);
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

    getGroupIdOfResource(groupId: string, resource: string) {
      const subGroupConfig = this.topToSubConfigMap[groupId];
      if (!subGroupConfig || !subGroupConfig[resource]) {
        return groupId;
      }
      const subGroupSeed = Object.values(subGroupConfig)[0];
      return subGroupSeed.group_id;
    },

    getTopGroupId(groupId: string) {
      return this.subToTopMap[groupId] || groupId;
    },
  };
}
