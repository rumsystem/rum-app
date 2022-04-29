import sleep from 'utils/sleep';
import { useStore } from 'store';
import GroupApi, { ISeed } from 'apis/group';
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

  return async (_seed: unknown, options: {
    afterDone?: () => void
    silent?: boolean
  } = {}) => {
    const seed = _seed as ISeed;
    await GroupApi.joinGroup(seed);
    await sleep(200);
    if (options.afterDone) {
      options.afterDone();
    }
    await fetchGroups();
    if (options.silent) {
      return;
    }
    await sleep(100);
    activeGroupStore.setId(seed.group_id);
    await sleep(200);
    snackbarStore.show({
      message: lang.joined,
    });
    const group = groupStore.map[seed.group_id];
    const followingRule = await AuthApi.getFollowingRule(activeGroupStore.id, 'POST');
    if (isPublicGroup(group) && !isNoteGroup(group) && followingRule.AuthType === 'FOLLOW_DNY_LIST') {
      (async () => {
        await sleep(1500);
        await initProfile(seed.group_id);
      })();
    }
  };
};
