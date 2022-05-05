import AuthApi from 'apis/auth';
import GroupApi, { GROUP_CONFIG_KEY, GROUP_TEMPLATE_TYPE, GROUP_DEFAULT_PERMISSION, IGroup } from 'apis/group';
import { Store } from 'store';
import SubGroup from 'utils/subGroup';
import UserApi from 'apis/user';
import sleep from 'utils/sleep';

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
  topGroup,
  resource,
  defaultPermission,
  store,
}: {
  topGroup: IGroup
  resource: string
  defaultPermission: GROUP_DEFAULT_PERMISSION
  store: Store
}) => {
  const seed = await GroupApi.createGroup({
    group_name: SubGroup.generateName(topGroup.group_id, 'comments'),
    consensus_type: 'poa',
    encryption_type: topGroup.encryption_type.toLowerCase(),
    app_key: GROUP_TEMPLATE_TYPE.TIMELINE,
  });
  await sleep(100);
  const { groups } = await GroupApi.fetchMyGroups();
  const subGroup = (groups || []).find((g) => g.group_id === seed.group_id) || ({} as IGroup);
  await handleDefaultPermission(subGroup.group_id, defaultPermission);
  if (defaultPermission === GROUP_DEFAULT_PERMISSION.READ || topGroup.encryption_type.toLowerCase() === 'private') {
    await handleAllowMode(subGroup.group_id, seed.owner_pubkey);
  }
  const name = GROUP_CONFIG_KEY.GROUP_SUB_GROUP_CONFIG;
  const value = JSON.stringify({
    [resource]: seed,
  });
  await GroupApi.changeGroupConfig({
    group_id: topGroup.group_id,
    action: 'add',
    name,
    type: 'string',
    value,
  });
  const { groupStore } = store;
  groupStore.updateTempGroupConfig(topGroup.group_id, {
    ...groupStore.configMap[topGroup.group_id] || {},
    [name]: value,
  });
  const subGroupAnnounceRet = await UserApi.announce({
    group_id: subGroup.group_id,
    action: 'add',
    type: 'user',
    memo: subGroup.user_eth_addr,
  });
  console.log({ subGroupAnnounceRet });
};
