import React from 'react';
import sleep from 'utils/sleep';
import { useStore } from 'store';
import MvmAPI from 'apis/mvm';
import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';
import { addMilliseconds } from 'date-fns';

const PAID_GROUP_TRX_TIMESTAMP_MAP_KEY = 'paidGroupTrxTimestampMap';
export const PAID_USER_ADDRESSES_MAP_KEY = 'paidUserAddressesMap';

export default (duration: number) => {
  const { nodeStore, groupStore } = useStore();

  const paidGroupTrxTimestampMap = (ElectronCurrentNodeStore.getStore().get(PAID_GROUP_TRX_TIMESTAMP_MAP_KEY) || {}) as any;
  const paidUserAddressesMap = (ElectronCurrentNodeStore.getStore().get(PAID_USER_ADDRESSES_MAP_KEY) || {}) as any;

  React.useEffect(() => {
    let stop = false;

    (async () => {
      await sleep(1000);
      while (!stop && !nodeStore.quitting) {
        await sleep(duration);
        await fetchPaiGroupTransactions();
      }
    })();

    async function fetchPaiGroupTransactions() {
      const groups = groupStore.groups.filter((group) =>
        group.encryption_type.toLocaleLowerCase() === 'private'
      && group.app_key !== GROUP_TEMPLATE_TYPE.NOTE
      && group.user_pubkey === group.owner_pubkey);
      for (const group of groups) {
        try {
          const groupId = group.group_id;
          const ret = await MvmAPI.fetchTransactions({
            timestamp: paidGroupTrxTimestampMap[group.group_id] || new Date(group.last_updated / 1000000).toISOString(),
            count: 100,
          });
          if ((ret.data || []).length === 0) {
            continue;
          }
          const payForGroupExtras = MvmAPI.selector.getPayForGroupExtras(ret.data || []);
          console.log({
            paidGroupTransactions: ret.data,
            payForGroupExtras,
          });
          paidUserAddressesMap[groupId] = paidUserAddressesMap[groupId] || [];
          const paidUserAddresses = paidUserAddressesMap[groupId];
          for (const extra of payForGroupExtras) {
            if (extra.data.group_id === groupId) {
              if (!paidUserAddresses.includes(extra.data.rum_address)) {
                paidUserAddresses.push(extra.data.rum_address);
              }
              console.log({ paidUserAddresses });
              ElectronCurrentNodeStore.getStore().set(PAID_USER_ADDRESSES_MAP_KEY, paidUserAddressesMap);
            }
          }
          paidGroupTrxTimestampMap[group.group_id] = addMilliseconds(new Date(ret.data[ret.data.length - 1].timestamp), 1).toISOString();
          ElectronCurrentNodeStore.getStore().set(PAID_GROUP_TRX_TIMESTAMP_MAP_KEY, paidGroupTrxTimestampMap);
        } catch (err) {
          console.log(err);
        }
      }
    }

    return () => {
      stop = true;
    };
  }, []);
};
