import AuthApi from 'apis/auth';
import GroupApi, { IGroup, GROUP_CONFIG_KEY, GROUP_TEMPLATE_TYPE } from 'apis/group';
import { Store } from 'store';

export const handleDesc = async (group: IGroup, desc: string) => {
  await GroupApi.changeGroupConfig({
    group_id: group.group_id,
    action: 'add',
    name: GROUP_CONFIG_KEY.GROUP_DESC,
    type: 'string',
    value: desc,
  });
};

export const handleDefaultPermission = async (group: IGroup, defaultPermission: string) => {
  await GroupApi.changeGroupConfig({
    group_id: group.group_id,
    action: 'add',
    name: GROUP_CONFIG_KEY.GROUP_DEFAULT_PERMISSION,
    type: 'string',
    value: defaultPermission,
  });
};

export const handleAllowMode = async (group: IGroup) => {
  await AuthApi.updateFollowingRule({
    group_id: group.group_id,
    type: 'set_trx_auth_mode',
    config: {
      trx_type: 'POST',
      trx_auth_mode: 'FOLLOW_ALW_LIST',
      memo: '',
    },
  });
  await AuthApi.updateAuthList({
    group_id: group.group_id,
    type: 'upd_alw_list',
    config: {
      action: 'add',
      pubkey: group.user_pubkey,
      trx_type: ['POST'],
      memo: '',
    },
  });
};


export const handleSubGroupConfig = async (group: IGroup, resource: string, store: Store) => {
  const seed = await GroupApi.createGroup({
    group_name: `sub_group_${group.group_id}_${resource}`,
    consensus_type: 'poa',
    encryption_type: 'public',
    app_key: GROUP_TEMPLATE_TYPE.TIMELINE,
  });
  const name = GROUP_CONFIG_KEY.GROUP_SUB_GROUP_CONFIG;
  const value = JSON.stringify({
    [resource]: seed,
  });
  await GroupApi.changeGroupConfig({
    group_id: group.group_id,
    action: 'add',
    name,
    type: 'string',
    value,
  });
  const { groupStore } = store;
  groupStore.updateTempGroupConfig(group.group_id, {
    ...groupStore.configMap[group.group_id] || {},
    [name]: value,
  });
};
