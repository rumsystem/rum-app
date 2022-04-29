import { useStore } from 'store';
import GroupApi from 'apis/group';
import { runInAction } from 'mobx';
import useDatabase from './useDatabase';
import removeGroupData from 'utils/removeGroupData';

export const useLeaveGroup = () => {
  const {
    activeGroupStore,
    groupStore,
    latestStatusStore,
  } = useStore();
  const database = useDatabase();

  const leaveGroup = async (groupId: string, options: {
    clear?: boolean
  } = {}) => {
    try {
      if (options.clear) {
        await GroupApi.clearGroup(groupId);
      }
      await GroupApi.leaveGroup(groupId);
      runInAction(() => {
        if (activeGroupStore.id === groupId) {
          const firstExistsGroupId = groupStore.topGroups.filter(
            (group) => group.group_id !== groupId,
          ).at(0)?.group_id ?? '';
          activeGroupStore.setId(firstExistsGroupId);
        }
        groupStore.deleteGroup(groupId);
        activeGroupStore.clearCache(groupId);
        latestStatusStore.remove(groupId);
      });
      await removeGroupData([database], groupId);
    } catch (err) {
      console.error(err);
    }
  };

  return async (groupId: string, options: {
    clear?: boolean
  } = {}) => {
    const subGroupIds = groupStore.topToSubsMap[groupId];
    await leaveGroup(groupId, options);
    if (subGroupIds && subGroupIds.length > 0) {
      for (const groupId of subGroupIds) {
        await leaveGroup(groupId, options);
      }
    }
  };
};
