import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { Tab, Tabs } from '@material-ui/core';
import { MdInfo } from 'react-icons/md';
import Button from 'components/Button';
import Balance from './Balance';
import Swap from './Swap';
import { sleep, PrsAtm } from 'utils';
import { useStore } from 'store';
import Tooltip from '@material-ui/core/Tooltip';

export default observer(() => {
  const { modalStore, snackbarStore, confirmDialogStore } = useStore();
  const state = useLocalStore(() => ({
    tab: 'balance',
    refreshing: false,
    claiming: false,
    authOfficialRewarding: false,
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
            message: '暂无收益可领取',
            type: 'error',
          });
        }
        state.claiming = false;
      },
    });
  };

  const authOfficialReward = () => {
    state.authOfficialRewarding = true;
    modalStore.verification.show({
      pass: (privateKey: string, accountName: string) => {
        (async () => {
          try {
            await PrsAtm.fetch({
              id: 'atm.authOfficialReward',
              actions: ['atm', 'authOfficialReward'],
              args: [accountName, privateKey],
              minPending: 600,
            });
            confirmDialogStore.show({
              content:
                '开启成功，当你有收益的时候，系统会自动帮你领取，你可以在流水中查看到具体的收益账单。如果迟迟没有领取到收益，你可以手动点击【领取收益】按钮',
              okText: '我知道了',
              ok: () => {
                confirmDialogStore.hide();
              },
              cancelDisabled: true,
            });
          } catch (err) {
            console.log(err);
          }
          state.authOfficialRewarding = false;
        })();
      },
      cancel: () => {
        state.authOfficialRewarding = false;
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
            <MdInfo className="text-18 mr-1 text-gray-d8" />
            交易记录会在交易完成后的3-5分钟生成
          </div>
          <div className="mr-4">
            <Tooltip
              placement="top"
              title="开启之后，当你有收益的时候，系统会自动帮你领取"
              arrow
            >
              <div>
                <Button
                  size="mini"
                  onClick={authOfficialReward}
                  isDoing={state.authOfficialRewarding}
                >
                  自动领取
                </Button>
              </div>
            </Tooltip>
          </div>
          <div className="mr-4">
            <Tooltip
              placement="top"
              title="领取出块或投票所获得的收益，每24小时可申领一次"
              arrow
            >
              <div>
                <Button
                  size="mini"
                  onClick={claimReward}
                  isDoing={state.claiming}
                >
                  领取收益
                </Button>
              </div>
            </Tooltip>
          </div>
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
