import { when } from 'mobx';
import sleep from 'utils/sleep';
import { useStore } from 'store';
import GroupApi, { GroupStatus, ICreateGroupsResult } from 'apis/group';
import useFetchGroups from 'hooks/useFetchGroups';
import useCheckGroupProfile from 'hooks/useCheckGroupProfile';
import { lang } from 'utils/lang';

export const useJoinGroup = () => {
  const {
    snackbarStore,
    activeGroupStore,
    seedStore,
    nodeStore,
    groupStore,
  } = useStore();
  const fetchGroups = useFetchGroups();
  const checkGroupProfile = useCheckGroupProfile();

  const trySetGlobalProfile = async (groupId: string) => {
    await Promise.race([
      when(() => !!groupStore.map[groupId]),
      sleep(10000),
    ]);

    if (!groupStore.map[groupId]) {
      return;
    }

    await Promise.race([
      when(() => groupStore.map[groupId].group_status === GroupStatus.IDLE),
      when(() => !groupStore.map[groupId]),
      sleep(1000 * 60 * 3),
    ]);

    if (groupStore.map[groupId]?.group_status !== GroupStatus.IDLE) {
      return;
    }

    checkGroupProfile(groupId);
  };

  const joinGroupProcess = async (_seed: unknown, afterDone?: () => void) => {
    const seed = _seed as ICreateGroupsResult;
    await GroupApi.joinGroup(seed);
    await sleep(600);
    await seedStore.addSeed(
      nodeStore.storagePath,
      seed.group_id,
      seed,
    );
    if (afterDone) {
      afterDone();
    }
    await fetchGroups();
    await sleep(200);
    activeGroupStore.setId(seed.group_id);
    await sleep(200);
    snackbarStore.show({
      message: lang.joined,
    });
    trySetGlobalProfile(seed.group_id);
  };

  return joinGroupProcess;
};
