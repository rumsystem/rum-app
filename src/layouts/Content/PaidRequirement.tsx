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
  const { snackbarStore } = useStore();
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
      } catch (err) {
        console.log(err);
      }
      state.fetched = true;
    })();
  }, []);

  const handlePay = async () => {
    state.paying = true;
    try {
      const ret = await MvmAPI.pay({
        group: groupId,
        user: group.user_eth_addr,
      });
      let timestamp = subMinutes(new Date(), 10).toISOString();
      const transactionUrl = await pay({
        paymentUrl: ret.data.url,
        desc: `请支付 ${state.amount} ${state.assetSymbol} 以使用该种子网络`,
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
        console.log('用户支付了');
        await announce(groupId, group.user_eth_addr);
        await sleep(400);
        state.userPaidForGroupMap[groupId] = transactionUrl;
        ElectronCurrentNodeStore.getStore().set(USER_PAID_FOR_GROUP_MAP_KEY, state.userPaidForGroupMap);
        state.paid = true;
      } else {
        console.error('用户取消了');
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
        这是一个收费的种子网络
        <br />
        请先支付 {state.amount} CNB 以开通使用
      </div>

      <Button
        className="mx-auto block mt-4"
        onClick={handlePay}
        isDoing={state.paying}
        disabled={state.paid}
      >
        {state.paid ? '已支付成功，等待创建者确认通过...' : '去支付'}
      </Button>
      {state.paid && (
        <div className="flex items-center mt-3 justify-center">
          {state.transactionUrl && (
            <div
              className="text-12 text-blue-400 cursor-pointer mr-4"
              onClick={() => {
                console.log(state.transactionUrl);
                shell.openExternal(state.transactionUrl);
              }}
            >
              支付凭证
            </div>
          )}
          <div
            className="text-12 text-blue-400 cursor-pointer"
            onClick={async () => {
              await announce(groupId, group.user_eth_addr);
              snackbarStore.show({
                message: '发起成功',
              });
            }}
          >
            <span>
              再次发起申请
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
