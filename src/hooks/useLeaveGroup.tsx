import { useStore } from 'store';
import GroupApi from 'apis/group';
import { runInAction } from 'mobx';
import useDatabase from './useDatabase';
import removeGroupData from 'utils/removeGroupData';
import { lang } from 'utils/lang';

export const useLeaveGroup = () => {
  const {
    activeGroupStore,
    groupStore,
    latestStatusStore,
    snackbarStore,
  } = useStore();
  const database = useDatabase();

  return async (groupId: string) => {
    try {
      await GroupApi.leaveGroup(groupId);
      runInAction(() => {
        if (activeGroupStore.id === groupId) {
          const firstExistsGroupId = groupStore.groups.filter(
            (group) => group.group_id !== groupId,
          ).at(0)?.group_id ?? '';
          activeGroupStore.setId(firstExistsGroupId);
        }
        groupStore.deleteGroup(groupId);
        activeGroupStore.clearCache(groupId);
        latestStatusStore.remove(groupId);
      });
      await removeGroupData([database], groupId);
      snackbarStore.show({
        message: lang.exited,
      });
    } catch (err) {
      console.error(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
  };
};
