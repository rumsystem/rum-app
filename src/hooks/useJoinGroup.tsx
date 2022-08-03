import sleep from 'utils/sleep';
import { useStore } from 'store';
import GroupApi from 'apis/group';
import useFetchGroups from 'hooks/useFetchGroups';
import { lang } from 'utils/lang';
import { initProfile } from 'standaloneModals/initProfile';
import AuthApi from 'apis/auth';
import QuorumLightNodeSDK from 'quorum-light-node-sdk';
import isV2Seed from 'utils/isV2Seed';
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

  const joinGroupProcess = async (seed: string, afterDone?: () => void, silent = false) => {
    const joinGroupPromise = isV2Seed(seed) ? GroupApi.joinGroupV2(seed) : GroupApi.joinGroup(seed);
    joinGroupPromise.finally(() => afterDone?.());
    await joinGroupPromise;
    await sleep(200);
    await fetchGroups();
    await sleep(100);
    const seedJson = isV2Seed(seed) ? QuorumLightNodeSDK.utils.restoreSeedFromUrl(seed) : JSON.parse(seed);
    const groupId = seedJson.group_id;
    activeGroupStore.setId(groupId);
    await sleep(200);
    if (!silent) {
      snackbarStore.show({
        message: lang.joined,
      });
      const group = groupStore.map[groupId];
      const followingRule = await AuthApi.getFollowingRule(activeGroupStore.id, 'POST');
      if (isPublicGroup(group) && !isNoteGroup(group) && followingRule.AuthType === 'FOLLOW_DNY_LIST') {
        (async () => {
          await sleep(1500);
          await initProfile(groupId);
        })();
      }
    }
  };

  return joinGroupProcess;
};
