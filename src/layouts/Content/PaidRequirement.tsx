import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Button from 'components/Button';
import pay from 'standaloneModals/pay';
import sleep from 'utils/sleep';
import useActiveGroup from 'store/selectors/useActiveGroup';
import MvmAPI from 'apis/mvm';
import { subMinutes, addMilliseconds } from 'date-fns';
import UserApi from 'apis/user';
import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';
import { useStore } from 'store';
import { lang } from 'utils/lang';
import Loading from 'components/Loading';
import { shell } from '@electron/remote';

const USER_PAID_FOR_GROUP_MAP_KEY = 'userPaidForGroupMap';
const USER_ANNOUNCED_RECORDS_KEY = 'userAnnouncedRecords';

export default observer(() => {
  const { snackbarStore, groupStore } = useStore();
  const group = useActiveGroup();
  const groupId = group.group_id;
  const state = useLocalObservable(() => ({
    fetched: false,
    paying: false,
    userPaidForGroupMap: (ElectronCurrentNodeStore.getStore().get(USER_PAID_FOR_GROUP_MAP_KEY) || {}) as any,
    amount: 0,
    paid: false,
    assetSymbol: '',

    get transactionUrl() {
      return this.userPaidForGroupMap[groupId];
    },
  }));

  React.useEffect(() => {
    (async () => {
      try {
        const groupDetail = await MvmAPI.fetchGroupDetail(groupId);
        state.amount = parseInt(groupDetail.data?.group?.price || '', 10);
        const userPayment = await MvmAPI.fetchUserPayment(groupId, group.user_eth_addr);
        state.paid = !!(userPayment && userPayment.data?.payment);
        state.assetSymbol = groupDetail.data.dapp.asset.symbol;
        if (state.paid) {
          await announce(groupId, group.user_eth_addr);
        }
      } catch (err) {
        console.log(err);
      }
      state.fetched = true;
    })();
  }, []);

  const handlePay = async () => {
    state.paying = true;
    try {
      const userPayment = await MvmAPI.fetchUserPayment(groupId, group.user_eth_addr);
      const paid = !!(userPayment && userPayment.data?.payment);
      if (paid) {
        await announce(groupId, group.user_eth_addr);
        state.paid = true;
        state.paying = false;
        return;
      }
      const ret = await MvmAPI.pay({
        group: groupId,
        user: group.user_eth_addr,
      });
      let timestamp = subMinutes(new Date(), 10).toISOString();
      const transactionUrl = await pay({
        paymentUrl: ret.data.url,
        desc: lang.payAndUse(state.amount, state.assetSymbol),
        check: async () => {
          const ret = await MvmAPI.fetchTransactions({
            timestamp,
            count: 100,
          });
          const payForGroupExtras = MvmAPI.selector.getPayForGroupExtras(ret.data || []);
          console.log({
            data: ret.data,
            payForGroupExtras,
          });
          if (ret.data && ret.data.length > 0) {
            timestamp = addMilliseconds(new Date(ret.data[ret.data.length - 1].timestamp), 1).toISOString();
          }
          for (const extra of payForGroupExtras) {
            if (extra.data.group_id === groupId && extra.data.rum_address === group.user_eth_addr) {
              return extra.transactionUrl;
            }
          }
          return '';
        },
      });
      if (transactionUrl) {
        ElectronCurrentNodeStore.getStore().set(USER_PAID_FOR_GROUP_MAP_KEY, state.userPaidForGroupMap);
        await announce(groupId, group.user_eth_addr);
        const subGroups = groupStore.topToSubGroupsMap[groupId] || [];
        for (const subGroup of subGroups) {
          await announce(subGroup.group_id, group.user_eth_addr);
        }
        await sleep(400);
        state.userPaidForGroupMap[groupId] = transactionUrl;
        state.paid = true;
      }
    } catch (err) {
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
    state.paying = false;
  };

  const announce = async (groupId: string, userAddress: string) => {
    const announceRet = await UserApi.announce({
      group_id: groupId,
      action: 'add',
      type: 'user',
      memo: userAddress,
    });
    console.log({ announceRet });
    const userAnnouncedRecords = (ElectronCurrentNodeStore.getStore().get(USER_ANNOUNCED_RECORDS_KEY) || []) as any;
    userAnnouncedRecords.push(announceRet);
    ElectronCurrentNodeStore.getStore().set(USER_ANNOUNCED_RECORDS_KEY, userAnnouncedRecords);
  };

  if (!state.fetched) {
    return (<div className="pt-40 flex justify-center">
      <Loading />
    </div>);
  }

  return (
    <div className="mt-32 mx-auto">
      <div
        className="text-gray-70 text-center text-16 leading-loose tracking-wide"
      >
        {lang.thisIsAPaidGroup}
        <br />
        {lang.payAndUse(state.amount, state.assetSymbol)}
      </div>

      <Button
        className="mx-auto block mt-4"
        onClick={handlePay}
        isDoing={state.paying}
        disabled={state.paid}
      >
        {state.paid ? lang.paidSuccessfully : lang.pay}
      </Button>
      {state.paid && (
        <div className="flex items-center mt-3 justify-center">
          {state.transactionUrl && (
            <div
              className="text-12 text-blue-400 cursor-pointer mr-4"
              onClick={() => {
                shell.openExternal(state.transactionUrl);
              }}
            >
              {lang.paidTicket}
            </div>
          )}
          <div
            className="text-12 text-blue-400 cursor-pointer"
            onClick={async () => {
              await announce(groupId, group.user_eth_addr);
              snackbarStore.show({
                message: lang.announced,
              });
            }}
          >
            <span>
              {lang.announceAgain}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
