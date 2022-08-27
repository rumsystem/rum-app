import { useStore } from 'store';
import GroupApi from 'apis/group';
import getSortedGroups from 'store/selectors/getSortedGroups';
import { runInAction } from 'mobx';
import sleep from 'utils/sleep';
import useDatabase from './useDatabase';
import removeGroupData from 'utils/removeGroupData';
import { lang } from 'utils/lang';
import useOffChainDatabase from './useOffChainDatabase';

export const useLeaveGroup = () => {
  const {
    activeGroupStore,
    groupStore,
    latestStatusStore,
    snackbarStore,
  } = useStore();
  const database = useDatabase();
  const offChainDatabase = useOffChainDatabase();

  return async (groupId: string) => {
    try {
      await GroupApi.clearGroup(groupId);
      await GroupApi.leaveGroup(groupId);
      await sleep(500);
      const sortedGroups = getSortedGroups(groupStore.groups, latestStatusStore.map);
      runInAction(() => {
        if (activeGroupStore.id === groupId) {
          const firstExistsGroupId = sortedGroups.filter(
            (group) => group.group_id !== groupId,
          ).at(0)?.group_id ?? '';
          activeGroupStore.setId(firstExistsGroupId);
        }
        groupStore.deleteGroup(groupId);
        activeGroupStore.clearCache(groupId);
        latestStatusStore.remove(database, groupId);
      });
      await removeGroupData([database, offChainDatabase], groupId);
      await sleep(300);
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
