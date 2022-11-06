import React from 'react';
import sleep from 'utils/sleep';
import { useStore } from 'store';
import UserApi from 'apis/user';
import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';
import { PAID_USER_ADDRESSES_MAP_KEY } from 'hooks/usePolling/usePollingPaidGroupTransaction';
import AuthApi from 'apis/auth';

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
        const groups = groupStore.groups.filter((g) => g.encryption_type.toLocaleLowerCase() === 'private' && g.user_pubkey === g.owner_pubkey);
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
