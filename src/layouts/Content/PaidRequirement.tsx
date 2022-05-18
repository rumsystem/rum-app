import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Button from 'components/Button';
import pay from 'standaloneModals/pay';
import sleep from 'utils/sleep';
import useActiveGroup from 'store/selectors/useActiveGroup';
import MvmAPI from 'apis/mvm';
import { subMinutes, addSeconds } from 'date-fns';
import UserApi from 'apis/user';
import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';
import { useStore } from 'store';
import { lang } from 'utils/lang';
import Loading from 'components/Loading';
import { shell } from '@electron/remote';

const USER_PAID_FOR_GROUP_MAP_KEY = 'userPaidForGroupMap';

export default observer(() => {
  const { snackbarStore } = useStore();
  const group = useActiveGroup();
  const groupId = group.group_id;
  const state = useLocalObservable(() => ({
    fetched: false,
    paying: false,
    userPaidForGroupMap: (ElectronCurrentNodeStore.getStore().get(USER_PAID_FOR_GROUP_MAP_KEY) || {}) as any,
    amount: 0,

    get paid() {
      return !!this.userPaidForGroupMap[groupId];
    },

    get transactionUrl() {
      return this.userPaidForGroupMap[groupId];
    },
  }));

  React.useEffect(() => {
    (async () => {
      try {
        const ret = await MvmAPI.fetchGroupDetail(groupId);
        state.amount = parseInt(ret.data?.price || '', 10);
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
      const transactionUrl = await pay({
        paymentUrl: ret.data.url,
        desc: `请支付 ${state.amount} CNB 以使用该种子网络`,
        check: async () => {
          let timestamp = subMinutes(new Date(), 60).toISOString();
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
            timestamp = addSeconds(new Date(ret.data[ret.data.length - 1].timestamp), 1).toISOString();
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
        const announceRet = await UserApi.announce({
          group_id: groupId,
          action: 'add',
          type: 'user',
          memo: group.user_eth_addr,
        });
        console.log({ announceRet });
        await sleep(400);
        state.userPaidForGroupMap[groupId] = transactionUrl;
        ElectronCurrentNodeStore.getStore().set(USER_PAID_FOR_GROUP_MAP_KEY, state.userPaidForGroupMap);
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
        <div
          className="mt-2 text-center"
          onClick={() => {
            console.log(state.transactionUrl);
            shell.openExternal(state.transactionUrl);
          }}
        >
          <span className="text-12 text-blue-400 cursor-pointer">
            支付凭证
          </span>
        </div>
      )}
    </div>
  );
});
