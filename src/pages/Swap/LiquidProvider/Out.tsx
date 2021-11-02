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
import { isEmpty } from 'lodash';

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
  const { walletStore, poolStore, modalStore, snackbarStore } = useStore();
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
    privateKey: '',
    accountName: '',
    get hasDryRunResult() {
      return !isEmpty(this.dryRunResult);
    },
  }));
  const balanceAmount =
    walletStore.balance[state.currencyPair.replace('-', '')];
  const isValid = state.amount && largerEq(balanceAmount, state.amount);

  const dryRun = () => {
    modalStore.verification.show({
      pass: async (_privateKey: string, _accountName: string) => {
        if (!_privateKey) {
          return;
        }
        state.privateKey = _privateKey;
        state.accountName = _accountName;
        state.showDryRunResult = false;
        state.dryRunning = true;
        try {
          const resp: any = await PrsAtm.fetch({
            id: 'swapToken.addLiquid',
            actions: ['exchange', 'rmLiquid'],
            args: [
              _privateKey,
              _accountName,
              state.currencyPair.split('-')[0],
              state.currencyPair.split('-')[1],
              state.amount,
              null,
              null,
              { dryrun: true },
            ],
            minPending: 600,
          });
          console.log({ resp });
          state.dryRunResult = resp as IDryRunResult;
          state.showDryRunResult = true;
          state.step = 2;
        } catch (err) {
          state.dryRunResult = {} as IDryRunResult;
          console.log(err);
        }
        state.dryRunning = false;
      },
    });
  };

  const submit = async () => {
    state.loading = true;
    state.done = false;
    try {
      await PrsAtm.fetch({
        id: 'exchange.cancelSwap',
        actions: ['exchange', 'cancelSwap'],
        args: [state.privateKey, state.accountName],
      });
    } catch (err) {}
    try {
      await PrsAtm.fetch({
        id: 'swapToken.addLiquid',
        actions: ['exchange', 'rmLiquid'],
        args: [
          state.privateKey,
          state.accountName,
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
      snackbarStore.show({
        message: '转出成功，可前往 Mixin 查看已到账的资产',
        duration: 3000,
      });
      const balance: any = await PrsAtm.fetch({
        id: 'getBalance',
        actions: ['account', 'getBalance'],
        args: [state.accountName],
      });
      walletStore.setBalance(balance);
    } catch (err) {
      console.log(err);
    }
    state.loading = false;
  };

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
                      state.step = 1;
                      state.showDryRunResult = false;
                    }}
                    onKeyDown={(e: any) => {
                      if (e.keyCode === 13) {
                        e.preventDefault();
                        e.target.blur();
                        if (isValid) {
                          state.step === 1 ? dryRun() : submit();
                        }
                      }
                    }}
                    margin="dense"
                    variant="outlined"
                    helperText={
                      <span className="text-12 text-gray-af">
                        可取数量：
                        {(state.currencyPair &&
                          Finance.toString(balanceAmount)) ||
                          0}
                      </span>
                    }
                  />
                </div>
              </div>
              <div className="mt-6 pt-1">
                <Button
                  fullWidth
                  isDoing={state.loading || state.dryRunning}
                  color={isValid ? 'primary' : 'gray'}
                  onClick={() =>
                    isValid && state.step === 1 ? dryRun() : submit()
                  }
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
              <div className="text-gray-88">收到资产</div>
              <div className="text-gray-70 font-bold">
                {state.dryRunResult.amount_a}
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="text-gray-88">收到资产</div>
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
