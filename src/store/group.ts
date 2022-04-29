import GroupApi, { GroupStatus, IGroup, GROUP_CONFIG_KEY, ISubGroupConfig } from 'apis/group';
import { observable, runInAction } from 'mobx';
import * as PersonModel from 'hooks/useDatabase/models/person';
import Database from 'hooks/useDatabase/database';
import getProfile from 'store/selectors/getProfile';
import { isGroupOwner } from 'store/selectors/group';
import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';
import { merge, isEmpty } from 'lodash';
import SubGroup from 'utils/subGroup';

type IHasAnnouncedProducersMap = Record<string, boolean>;

export type IConfig = Record<string, number | string | boolean>;

export type IConfigMap = Record<string, IConfig>;

const CONFIG_MAP_STORE_KEY = 'configMap';

export function createGroupStore() {
  return {
    map: {} as Record<string, IGroup>,

    _configMap: {} as IConfigMap,

    _tempConfigMap: {} as IConfigMap,

    hasAnnouncedProducersMap: {} as IHasAnnouncedProducersMap,

    get ids() {
      return Object.keys(this.map);
    },

    get groups() {
      return Object.values(this.map);
    },

    get topIds() {
      return this.ids.filter((id) => !this.subToTopMap[id] && !SubGroup.isSubGroupName(this.map[id].group_name));
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

    get notOwnGroups() {
      return this.groups.filter((g) => !isGroupOwner(g));
    },

    get configMap() {
      return merge({ ...this._configMap }, this._tempConfigMap);
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

    get topToSubsMap() {
      const map: Record<string, string[]> = {};
      for (const [topGroupId, subConfig] of Object.entries(this.topToSubConfigMap)) {
        map[topGroupId] = Object.values(subConfig).map((seed) => seed.group_id);
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
      const storeConfigMap = (ElectronCurrentNodeStore.getStore().get(CONFIG_MAP_STORE_KEY) || {}) as IConfigMap;
      this._configMap = storeConfigMap;
    },

    setConfigMap(data: ([string, IConfig])[]) {
      const map: IConfigMap = {};
      for (const [groupId, config] of data) {
        if (!isEmpty(config)) {
          map[groupId] = config;
        }
      }
      if (isEmpty(map)) {
        return;
      }
      this._configMap = map;
      ElectronCurrentNodeStore.getStore().set(CONFIG_MAP_STORE_KEY, this._configMap);
    },

    updateGroupConfig(groupId: string, config: IConfig) {
      if (isEmpty(config)) {
        return;
      }
      this._configMap[groupId] = config;
      ElectronCurrentNodeStore.getStore().set(CONFIG_MAP_STORE_KEY, this._configMap);
    },

    updateTempGroupConfig(groupId: string, config: IConfig) {
      if (isEmpty(config)) {
        return;
      }
      this._tempConfigMap[groupId] = config;
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

    deleteGroup(id: string) {
      delete this.map[id];
      delete this._configMap[id];
      delete this._tempConfigMap[id];
      ElectronCurrentNodeStore.getStore().set(CONFIG_MAP_STORE_KEY, this._configMap);
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

    setHasAnnouncedProducersMap(groupId: string, value: boolean) {
      this.hasAnnouncedProducersMap[groupId] = value;
    },
  };
}
