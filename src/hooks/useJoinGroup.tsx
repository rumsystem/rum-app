import sleep from 'utils/sleep';
import { useStore } from 'store';
import GroupApi from 'apis/group';
import fetchGroups from 'hooks/fetchGroups';
import { lang } from 'utils/lang';
// import { initProfile } from 'standaloneModals/initProfile';
// import AuthApi from 'apis/auth';
import QuorumLightNodeSDK from 'quorum-light-node-sdk';
import isV2Seed from 'utils/isV2Seed';
import {
  isPublicGroup,
  isNoteGroup,
} from 'store/selectors/group';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';

export const useJoinGroup = () => {
  const {
    snackbarStore,
    activeGroupStore,
    groupStore,
    modalStore,
  } = useStore();

  const joinGroupProcess = async (seed: string, afterDone?: () => void, silent = false) => {
    const joinGroupPromise = isV2Seed(seed) ? GroupApi.joinGroupV2(seed) : GroupApi.joinGroup(seed);
    joinGroupPromise.finally(() => afterDone?.());
    await joinGroupPromise;
    await sleep(200);
    await fetchGroups();
    await sleep(100);
    const seedJson = isV2Seed(seed) ? QuorumLightNodeSDK.utils.restoreSeedFromUrl(seed) : JSON.parse(seed);
    const result = /&o=([a-zA-Z0-9-]*)/.exec(seed);
    if (result && result[1]) {
      seedJson.targetObject = result[1];
    }
    const groupId = seedJson.group_id;
    activeGroupStore.setId(groupId);
    await sleep(200);
    if (!silent) {
      snackbarStore.show({
        message: lang.joined,
      });
      const group = groupStore.map[groupId];
      // const followingRule = await AuthApi.getFollowingRule(activeGroupStore.id, 'POST');
      if (isPublicGroup(group) && !isNoteGroup(group)) {
        // if (followingRule.AuthType === 'FOLLOW_DNY_LIST') {
        //   await (async () => {
        //     await sleep(1500);
        //     await initProfile(groupId);
        //   })();
        // }
        if (seedJson?.targetObject) {
          if (seedJson.app_key === GROUP_TEMPLATE_TYPE.TIMELINE) {
            modalStore.objectDetail.show({
              postId: seedJson.targetObject,
            });
          } else if (seedJson.app_key === GROUP_TEMPLATE_TYPE.POST) {
            modalStore.forumObjectDetail.show({
              objectId: seedJson.targetObject,
            });
          }
        }
      }
    }
  };

  return joinGroupProcess;
};
