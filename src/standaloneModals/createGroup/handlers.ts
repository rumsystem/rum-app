import AuthApi from 'apis/auth';
import GroupApi, { GROUP_CONFIG_KEY, GROUP_TEMPLATE_TYPE, GROUP_DEFAULT_PERMISSION } from 'apis/group';
import { Store } from 'store';
import SubGroup from 'utils/subGroup';

export const handleDesc = async (groupId: string, desc: string) => {
  await GroupApi.changeGroupConfig({
    group_id: groupId,
    action: 'add',
    name: GROUP_CONFIG_KEY.GROUP_DESC,
    type: 'string',
    value: desc,
  });
};

export const handleDefaultPermission = async (groupId: string, defaultPermission: GROUP_DEFAULT_PERMISSION) => {
  await GroupApi.changeGroupConfig({
    group_id: groupId,
    action: 'add',
    name: GROUP_CONFIG_KEY.GROUP_DEFAULT_PERMISSION,
    type: 'string',
    value: defaultPermission,
  });
};

export const handleAllowMode = async (groupId: string, pubkey: string) => {
  await AuthApi.updateFollowingRule({
    group_id: groupId,
    type: 'set_trx_auth_mode',
    config: {
      trx_type: 'POST',
      trx_auth_mode: 'FOLLOW_ALW_LIST',
      memo: '',
    },
  });
  await AuthApi.updateAuthList({
    group_id: groupId,
    type: 'upd_alw_list',
    config: {
      action: 'add',
      pubkey,
      trx_type: ['POST'],
      memo: '',
    },
  });
};

export const handleSubGroupConfig = async ({
  groupId,
  resource,
  defaultPermission,
  encryptionType,
  store,
}: {
  groupId: string
  resource: string
  defaultPermission: GROUP_DEFAULT_PERMISSION
  encryptionType: 'private' | 'public'
  store: Store
}) => {
  const seed = await GroupApi.createGroup({
    group_name: SubGroup.generateName(groupId, 'comments'),
    consensus_type: 'poa',
    encryption_type: 'public',
    app_key: GROUP_TEMPLATE_TYPE.TIMELINE,
  });
  const subGroupId = seed.group_id;
  await handleDefaultPermission(subGroupId, defaultPermission);
  if (defaultPermission === GROUP_DEFAULT_PERMISSION.READ || encryptionType === 'private') {
    await handleAllowMode(subGroupId, seed.owner_pubkey);
  }
  const name = GROUP_CONFIG_KEY.GROUP_SUB_GROUP_CONFIG;
  const value = JSON.stringify({
    [resource]: seed,
  });
  await GroupApi.changeGroupConfig({
    group_id: groupId,
    action: 'add',
    name,
    type: 'string',
    value,
  });
  const { groupStore } = store;
  groupStore.updateTempGroupConfig(groupId, {
    ...groupStore.configMap[groupId] || {},
    [name]: value,
  });
};
