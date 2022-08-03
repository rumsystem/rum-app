import sleep from 'utils/sleep';
import { useStore } from 'store';
import GroupApi, { ICreateGroupsResult } from 'apis/group';
import useFetchGroups from 'hooks/useFetchGroups';
import { lang } from 'utils/lang';
import { initProfile } from 'standaloneModals/initProfile';
import AuthApi from 'apis/auth';
import QuorumLightNodeSDK from 'quorum-light-node-sdk';
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

  const joinGroupProcess = async (data: any, afterDone?: () => void, silent = false) => {
    const isV2 = !!data.seed;
    const joinGroupPromise = isV2 ? GroupApi.joinGroupV2(data) : GroupApi.joinGroup(data as ICreateGroupsResult);
    joinGroupPromise.finally(() => afterDone?.());
    await joinGroupPromise;
    await sleep(200);
    await fetchGroups();
    await sleep(100);
    const groupId = isV2 ? QuorumLightNodeSDK.utils.restoreSeedFromUrl(data.seed).group_id : data.group_id;
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
