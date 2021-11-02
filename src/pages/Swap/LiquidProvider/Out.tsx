import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { BiChevronDown } from 'react-icons/bi';
import Button from 'components/Button';
import { TextField } from '@material-ui/core';
import CurrencyPairSelectorModal from './CurrencyPairSelectorModal';
import { Finance, PrsAtm, sleep } from 'utils';
import { useStore } from 'store';
import { largerEq } from 'mathjs';
import Fade from '@material-ui/core/Fade';
import classNames from 'classnames';
import { isEmpty, debounce } from 'lodash';

interface IDryRunResult {
  amount_a: string;
  amount_b: string;
  chainAccount: string;
  currency_a: string;
  currency_b: string;
  memo: string;
  notification: string;
  pool: string;
  pool_token: string;
  transaction: any;
}

export default observer(() => {
  const {
    walletStore,
    poolStore,
    modalStore,
    confirmDialogStore,
    accountStore,
  } = useStore();
  const { isLogin } = accountStore;
  const state = useLocalStore(() => ({
    step: 1,
    loading: false,
    done: false,
    dryRunning: false,
    currencyPair: poolStore.currencyPairs[0],
    amount: '',
    openCurrencyPairSelectorModal: false,
    showDryRunResult: false,
    dryRunResult: {} as IDryRunResult,
    get hasDryRunResult() {
      return !isEmpty(this.dryRunResult);
    },
  }));
  const balanceAmount = isLogin
    ? walletStore.balance[state.currencyPair.replace('-', '')] || '0'
    : '';
  const isValid =
    !isLogin || (state.amount && largerEq(balanceAmount, state.amount));

  const dryRun = async () => {
    if (!state.amount) {
      return;
    }
    state.showDryRunResult = false;
    state.dryRunning = true;
    try {
      const resp: any = await PrsAtm.fetch({
        id: 'swapToken.addLiquid',
        actions: ['exchange', 'rmLiquid'],
        args: [
          null,
          null,
          state.currencyPair.split('-')[0],
          state.currencyPair.split('-')[1],
          state.amount,
          null,
          null,
          { dryrun: true },
        ],
        minPending: 600,
      });
      state.dryRunResult = resp as IDryRunResult;
      state.showDryRunResult = true;
      state.step = 2;
    } catch (err) {
      state.dryRunResult = {} as IDryRunResult;
      console.log(err);
    }
    state.dryRunning = false;
  };

  const submit = () => {
    if (!accountStore.isLogin) {
      modalStore.auth.show();
      return;
    }
    modalStore.verification.show({
      pass: async (privateKey: string, accountName: string) => {
        state.loading = true;
        state.done = false;
        try {
          await PrsAtm.fetch({
            id: 'exchange.cancelSwap',
            actions: ['exchange', 'cancelSwap'],
            args: [privateKey, accountName],
          });
        } catch (err) {}
        try {
          await PrsAtm.fetch({
            id: 'swapToken.addLiquid',
            actions: ['exchange', 'rmLiquid'],
            args: [
              privateKey,
              accountName,
              state.currencyPair.split('-')[0],
              state.currencyPair.split('-')[1],
              state.amount,
              null,
            ],
            minPending: 600,
          });
          state.done = true;
          await sleep(500);
          state.amount = '';
          state.showDryRunResult = false;
          confirmDialogStore.show({
            content: '转出成功，可前往 Mixin 查看已到账的资产',
            okText: '我知道了',
            ok: () => confirmDialogStore.hide(),
            cancelDisabled: true,
          });
          const balance: any = await PrsAtm.fetch({
            id: 'getBalance',
            actions: ['account', 'getBalance'],
            args: [accountName],
          });
          walletStore.setBalance(balance);
          (async () => {
            try {
              await sleep(5000);
              const resp: any = await PrsAtm.fetch({
                id: 'getAllPools',
                actions: ['swap', 'getAllPools'],
              });
              poolStore.setPools(resp);
            } catch (err) {}
          })();
        } catch (err) {
          console.log(err);
        }
        state.loading = false;
      },
    });
  };

  const inputChangeDryRun = React.useCallback(debounce(dryRun, 400), []);

  return (
    <div>
      <div className="bg-white rounded-12 shadow-lg text-gray-70 font-bold z-10 relative">
        <div className="pb-16" />
        <div className="px-8 pb-6">
          <Fade in={true} timeout={500}>
            <div>
              <div className="flex items-center justify-between pt-3 pb-2">
                <div
                  className="font-bold flex items-center text-18 cursor-pointer"
                  onClick={() => {
                    state.openCurrencyPairSelectorModal = true;
                  }}
                >
                  {state.currencyPair}
                  <BiChevronDown className="text-18 ml-1" />
                </div>
                <div className="w-32 mt-3">
                  <TextField
                    autoFocus
                    value={state.amount}
                    onChange={(e) => {
                      state.amount = e.target.value;
                      state.showDryRunResult = false;
                      inputChangeDryRun();
                    }}
                    margin="dense"
                    variant="outlined"
                    helperText={
                      <span>
                        可取数量：
                        {isLogin
                          ? (state.currencyPair &&
                              Finance.toString(balanceAmount)) ||
                            0
                          : 0}
                      </span>
                    }
                  />
                </div>
              </div>
              <div className="mt-6 pt-1">
                <Button
                  fullWidth
                  isDoing={state.loading || state.dryRunning}
                  hideText={state.dryRunning}
                  color={state.showDryRunResult && isValid ? 'primary' : 'gray'}
                  onClick={() => isValid && submit()}
                >
                  {state.step === 1 ? '预览' : '确定'}
                </Button>
              </div>
            </div>
          </Fade>
        </div>
      </div>

      <div
        className={classNames(
          {
            show: state.showDryRunResult,
          },
          'z-0 absolute bottom-0 left-0 remove-lp-detail w-full duration-500 ease-in-out transition-all'
        )}
      >
        {state.hasDryRunResult && (
          <div className="bg-white bg-opacity-75 text-12 px-6 pt-8 pb-4 leading-none mx-4 rounded-12 rounded-t-none">
            <div className="flex items-center justify-between mt-2">
              <div className="text-gray-88">收到资产A</div>
              <div className="text-gray-70 font-bold">
                {state.dryRunResult.amount_a}
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-gray-88">收到资产B</div>
              <div className="text-gray-70 font-bold">
                {state.dryRunResult.amount_b}
              </div>
            </div>
          </div>
        )}
      </div>

      <CurrencyPairSelectorModal
        open={state.openCurrencyPairSelectorModal}
        onClose={(currencyPair?: string) => {
          if (currencyPair) {
            state.currencyPair = currencyPair;
          }
          state.openCurrencyPairSelectorModal = false;
        }}
      />

      <style jsx>{`
        .remove-lp-detail.show {
          bottom: -65px;
        }
        .remove-lp-detail {
          bottom: 0;
        }
      `}</style>
    </div>
  );
});
