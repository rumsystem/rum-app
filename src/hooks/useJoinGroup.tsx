import sleep from 'utils/sleep';
import { useStore } from 'store';
import GroupApi, { ICreateGroupsResult } from 'apis/group';
import useFetchGroups from 'hooks/useFetchGroups';
import { lang } from 'utils/lang';
import { initProfile } from 'standaloneModals/initProfile';
import AuthApi from 'apis/auth';
import {
  isPublicGroup,
  isNoteGroup,
} from 'store/selectors/group';

export const useJoinGroup = () => {
  const {
    snackbarStore,
    activeGroupStore,
    groupStore,
  } = useStore();
  const fetchGroups = useFetchGroups();

  const joinGroupProcess = async (_seed: unknown, afterDone?: () => void, silent = false) => {
    const seed = _seed as ICreateGroupsResult;
    const joinGroupPromise = GroupApi.joinGroup(seed);
    joinGroupPromise.finally(() => afterDone?.());
    await joinGroupPromise;
    await sleep(200);
    await fetchGroups();
    await sleep(100);
    activeGroupStore.setId(seed.group_id);
    await sleep(200);
    if (!silent) {
      snackbarStore.show({
        message: lang.joined,
      });
      const group = groupStore.map[seed.group_id];
      const followingRule = await AuthApi.getFollowingRule(activeGroupStore.id, 'POST');
      if (isPublicGroup(group) && !isNoteGroup(group) && followingRule.AuthType === 'FOLLOW_DNY_LIST') {
        (async () => {
          console.log('test');
          await sleep(1500);
          await initProfile(seed.group_id);
        })();
      }
    }
  };

  return joinGroupProcess;
};
