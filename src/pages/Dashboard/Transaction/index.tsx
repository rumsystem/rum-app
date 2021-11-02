import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { Tab, Tabs } from '@material-ui/core';
import { MdHelp } from 'react-icons/md';
import Button from 'components/Button';
import Balance from './Balance';
import Swap from './Swap';
import { sleep, PrsAtm } from 'utils';
import { useStore } from 'store';

export default observer(() => {
  const { modalStore, snackbarStore } = useStore();
  const state = useLocalStore(() => ({
    tab: 'balance',
    refreshing: false,
    claiming: false,
  }));

  const claimReward = async () => {
    modalStore.verification.show({
      pass: async (privateKey: string, accountName: string) => {
        state.claiming = true;
        try {
          const resp: any = await PrsAtm.fetch({
            id: 'exchange.cancelSwap',
            actions: ['producer', 'claimRewards'],
            args: [accountName, privateKey],
            minPending: 600,
          });
          console.log({ resp });
        } catch (err) {
          console.log(err);
          snackbarStore.show({
            message: '没有领取到收益',
            type: 'error',
            duration: 2000,
          });
        }
        state.claiming = false;
      },
    });
  };

  return (
    <div className="bg-white rounded-12 text-gray-6d">
      <div className="relative pt-1">
        <Tabs
          className="pl-5"
          value={state.tab}
          onChange={(_e, tab) => {
            state.tab = tab;
          }}
        >
          <Tab value="balance" label="流水账单" />
          <Tab value="swap" label="兑换记录" />
        </Tabs>
        <div className="absolute top-0 right-0 mt-2 mr-4 flex items-center pt-3-px">
          <div className="mr-5 text-gray-bd text-12 flex items-center mt-2-px">
            <MdHelp className="text-18 mr-1 text-gray-d8" />
            交易记录会在交易完成后的3-5分钟生成
          </div>
          <Button
            size="mini"
            className="mr-4"
            onClick={claimReward}
            isDoing={state.claiming}
          >
            领取收益
          </Button>
          <Button
            size="mini"
            outline
            onClick={async () => {
              state.refreshing = true;
              await sleep(10);
              state.refreshing = false;
            }}
          >
            刷新
          </Button>
        </div>
      </div>
      {state.refreshing && <div className="h-42" />}
      {!state.refreshing && (
        <div>
          {state.tab === 'balance' && <Balance />}
          {state.tab === 'swap' && <Swap />}
        </div>
      )}
    </div>
  );
});
