import React from 'react';
import rumsdk from 'rum-sdk-browser';
import { Contract } from 'ethers';
import { useStore } from 'store';
import { isPrivateGroup, isGroupOwner } from 'store/selectors/group';
import UserApi from 'apis/user';
import AuthApi from 'apis/auth';
import { GROUP_CONFIG_KEY, GROUP_DEFAULT_PERMISSION } from 'utils/constant';
import sleep from 'utils/sleep';
import * as ContractUtils from 'utils/contract';

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
        const groups = groupStore.groups.filter((g) => isPrivateGroup(g) && isGroupOwner(g));
        for (const group of groups) {
          try {
            const ret = await UserApi.fetchAnnouncedUsers(group.group_id);
            const announcedUsers = ret.filter((user) => user.Result === 'ANNOUNCED');
            if ((announcedUsers || []).length === 0) {
              continue;
            }
            console.log({ announcedUsers });
            for (const user of announcedUsers) {
              try {
                const contract = new Contract(ContractUtils.PAID_GROUP_CONTRACT_ADDRESS, ContractUtils.PAID_GROUP_ABI, ContractUtils.provider);
                const isPaidUser = await contract.isPaid(rumsdk.utils.pubkeyToAddress(user.AnnouncedSignPubkey), BigInt('0x' + group.group_id.replace(/-/g, '')));
                if (isPaidUser || user.AnnouncedSignPubkey === group.user_pubkey) {
                  console.log('approve user', user);
                  await UserApi.declare({
                    user_pubkey: user.AnnouncedSignPubkey,
                    group_id: group.group_id,
                    action: 'add',
                  });
                  const groupDefaultPermission = (groupStore.configMap.get(group.group_id)?.[GROUP_CONFIG_KEY.GROUP_DEFAULT_PERMISSION] ?? '') as string;
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
                          trx_type: ['post'],
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
