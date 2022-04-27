import React from 'react';
import sleep from 'utils/sleep';
import { useStore } from 'store';
import UserApi from 'apis/user';
import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';
import { PAID_USER_ADDRESSES_MAP_KEY } from 'hooks/usePolling/usePollingPaidGroupTransaction';
import { isPrivateGroup, isGroupOwner } from 'store/selectors/group';
import AuthApi from 'apis/auth';
import { GROUP_CONFIG_KEY, GROUP_DEFAULT_PERMISSION } from 'apis/group';

export default (duration: number) => {
  const { nodeStore, groupStore } = useStore();

  React.useEffect(() => {
    let stop = false;

    (async () => {
      await sleep(1000);
      while (!stop && !nodeStore.quitting) {
        await sleep(duration);
        await checkAnnouncedUsers();
      }
    })();

    async function checkAnnouncedUsers() {
      try {
        const groups = groupStore.topGroups.filter((g) => isPrivateGroup(g) && isGroupOwner(g));
        for (const group of groups) {
          try {
            const ret = await UserApi.fetchAnnouncedUsers(group.group_id);
            const announcedUsers = ret.filter((user) => user.Result === 'ANNOUNCED');
            if ((announcedUsers || []).length === 0) {
              continue;
            }
            console.log({ announcedUsers });
            const paidUserAddressesMap = (ElectronCurrentNodeStore.getStore().get(PAID_USER_ADDRESSES_MAP_KEY) || {}) as any;
            const paidUserAddresses = paidUserAddressesMap[group.group_id] || [];
            for (const user of announcedUsers) {
              try {
                if (paidUserAddresses.includes(user.Memo) || user.AnnouncedSignPubkey === group.user_pubkey) {
                  console.log('approve user', user);
                  await UserApi.declare({
                    user_pubkey: user.AnnouncedSignPubkey,
                    group_id: group.group_id,
                    action: 'add',
                  });
                  const groupDefaultPermission = (groupStore.configMap[group.group_id]?.[GROUP_CONFIG_KEY.GROUP_DEFAULT_PERMISSION] ?? '') as string;
                  console.log({ groupDefaultPermission });
                  const followingRule = await AuthApi.getFollowingRule(group.group_id, 'POST');
                  if (followingRule.AuthType === 'FOLLOW_ALW_LIST') {
                    if (user.AnnouncedSignPubkey === group.user_pubkey || groupDefaultPermission === GROUP_DEFAULT_PERMISSION.WRITE) {
                      await AuthApi.updateAuthList({
                        group_id: group.group_id,
                        type: 'upd_alw_list',
                        config: {
                          action: 'add',
                          pubkey: user.AnnouncedSignPubkey,
                          trx_type: ['POST'],
                          memo: '',
                        },
                      });
                    }
                  }
                }
              } catch (err) {
                console.log(err);
              }
            }
          } catch (err) {
            console.log(err);
          }
        }
      } catch (err) {
        console.log(err);
      }
    }

    return () => {
      stop = true;
    };
  }, []);
};
