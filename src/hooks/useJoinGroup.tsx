import sleep from 'utils/sleep';
import { useStore } from 'store';
import GroupApi, { ICreateGroupsResult } from 'apis/group';
import useFetchGroups from 'hooks/useFetchGroups';
import { lang } from 'utils/lang';
import { initProfile } from 'standaloneModals/initProfile';
import AuthApi from 'apis/auth';

export const useJoinGroup = () => {
  const {
    snackbarStore,
    activeGroupStore,
    groupStore,
  } = useStore();
  const fetchGroups = useFetchGroups();

  const joinGroupProcess = async (_seed: unknown, afterDone?: () => void) => {
    const seed = _seed as ICreateGroupsResult;
    await GroupApi.joinGroup(seed);
    await sleep(200);
    if (afterDone) {
      afterDone();
    }
    await fetchGroups();
    await sleep(100);
    activeGroupStore.setId(seed.group_id);
    await sleep(200);
    snackbarStore.show({
      message: lang.joined,
    });
    const group = groupStore.map[seed.group_id];
    const followingRule = await AuthApi.getFollowingRule(activeGroupStore.id, 'POST');
    if (group.encryption_type.toLowerCase() === 'public' && followingRule.AuthType === 'FOLLOW_DNY_LIST') {
      (async () => {
        await sleep(1500);
        await initProfile(seed.group_id);
      })();
    }
  };

  return joinGroupProcess;
};
