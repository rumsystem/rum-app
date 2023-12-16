import sleep from 'utils/sleep';
import { useStore } from 'store';
import GroupApi, { ICreateGroupsResult } from 'apis/group';
import useFetchGroups from 'hooks/useFetchGroups';
import { lang } from 'utils/lang';
import { initProfile } from 'standaloneModals/initProfile';

export const useJoinGroup = () => {
  const {
    snackbarStore,
    activeGroupStore,
  } = useStore();
  const fetchGroups = useFetchGroups();

  const joinGroupProcess = async (_seed: unknown, afterDone?: () => void) => {
    const seed = _seed as ICreateGroupsResult;
    await GroupApi.joinGroup(seed);
    await sleep(600);
    if (afterDone) {
      afterDone();
    }
    await fetchGroups();
    await sleep(200);
    await initProfile(seed.group_id);
    await sleep(200);
    activeGroupStore.setId(seed.group_id);
    await sleep(200);
    snackbarStore.show({
      message: lang.joined,
    });
  };

  return joinGroupProcess;
};
