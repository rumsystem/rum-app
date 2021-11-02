import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { BiChevronDown } from 'react-icons/bi';
import Button from 'components/Button';
import { TextField } from '@material-ui/core';
import CurrencyPairSelectorModal from './CurrencyPairSelectorModal';
import { Finance, PrsAtm, sleep, getQuery, removeQuery } from 'utils';
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

const toFixed4 = (text: string) => {
  const numPart = text.match(/^(?<value>\d+(\.\d+)?) (?<coin>.+)$/);
  let value = numPart?.groups?.value ?? '0';
  const coin = numPart?.groups?.coin ?? '';
  value = Finance.formatWithPrecision(value, 4);
  return `${value} ${coin}`;
};

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
    loading: false,
    done: false,
    dryRunning: false,
    currencyPair: ['', ''],
    amount: '',
    openCurrencyPairSelectorModal: false,
    invalidToAmount: false,
    showDryRunResult: false,
    dryRunResult: {} as IDryRunResult,
    get hasDryRunResult() {
      return !isEmpty(this.dryRunResult);
    },
  }));
  const balanceAmount = isLogin
    ? walletStore.balance[state.currencyPair.join('')] || '0'
    : '';
  const validAmount =
    !isLogin || (state.amount && largerEq(balanceAmount, state.amount));

  React.useEffect(() => {
    (async () => {
      if (getQuery('token')) {
        state.currencyPair = poolStore.tokenCurrencyPairMap[getQuery('token')];
        removeQuery('token');
      } else {
        state.currencyPair = poolStore.currencyPairs[0];
      }
    })();
  }, [state, poolStore]);

  const dryRun = async () => {
    if (!state.amount) {
      return;
    }
    state.showDryRunResult = false;
    state.dryRunning = true;
    try {
      const resp: any = await PrsAtm.fetch({
        actions: ['exchange', 'rmLiquid'],
        args: [
          null,
          null,
          state.currencyPair[0],
          state.currencyPair[1],
          state.amount,
          null,
          null,
          { dryrun: true },
        ],
        minPending: 600,
        logging: true,
      });
      state.dryRunResult = resp as IDryRunResult;
      state.dryRunResult.amount_a = toFixed4(state.dryRunResult.amount_a);
      state.dryRunResult.amount_b = toFixed4(state.dryRunResult.amount_b);

      state.showDryRunResult = true;
      state.invalidToAmount =
        !Finance.largerEqMinNumber(
          state.dryRunResult.amount_a.replace(
            ' ' + state.dryRunResult.currency_a,
            ''
          ),
          '0.0001'
        ) ||
        !Finance.largerEqMinNumber(
          state.dryRunResult.amount_b.replace(
            ' ' + state.dryRunResult.currency_b,
            ''
          ),
          '0.0001'
        );
    } catch (err) {
      state.dryRunResult = {} as IDryRunResult;
      console.log(err.message);
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
          const pendingRequest: any = await PrsAtm.fetch({
            actions: ['exchange', 'getPaymentRequest'],
            args: [accountName],
            for: 'exchange.getPaymentRequest',
            logging: true,
          });
          console.log({ pendingRequest });
          if (pendingRequest) {
            await PrsAtm.fetch({
              actions: ['exchange', 'cancelSwap'],
              args: [privateKey, accountName],
              for: 'beforeRmLiquid',
              logging: true,
            });
            await sleep(1000);
          }
        } catch (err) {
          console.log(err);
        }
        try {
          await PrsAtm.fetch({
            actions: ['exchange', 'rmLiquid'],
            args: [
              privateKey,
              accountName,
              state.currencyPair[0],
              state.currencyPair[1],
              state.amount,
              null,
            ],
            minPending: 600,
            logging: true,
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
            actions: ['account', 'getBalance'],
            args: [accountName],
          });
          walletStore.setBalance(balance);
          (async () => {
            try {
              await sleep(5000);
              const resp: any = await PrsAtm.fetch({
                actions: ['swap', 'getAllPools'],
              });
              poolStore.setPools(resp);
            } catch (err) {}
          })();
        } catch (err) {
          console.log(err.message);
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
                  {state.currencyPair.join('-')}
                  <BiChevronDown className="text-18 ml-1" />
                </div>
                <div className="w-32 mt-3">
                  <TextField
                    autoFocus
                    value={state.amount}
                    onChange={(e) => {
                      const { value } = e.target;
                      if (Finance.isValidAmount(value)) {
                        state.amount = e.target.value;
                        state.showDryRunResult = false;
                        inputChangeDryRun();
                      }
                    }}
                    margin="dense"
                    variant="outlined"
                    helperText={
                      <span className="-ml-1">
                        数量:{' '}
                        {isLogin
                          ? (state.currencyPair.join('-') &&
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
                  color={
                    state.showDryRunResult &&
                    validAmount &&
                    !state.invalidToAmount
                      ? 'primary'
                      : 'gray'
                  }
                  onClick={() =>
                    validAmount && !state.invalidToAmount && submit()
                  }
                >
                  确定
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
            {!state.invalidToAmount && (
              <div>
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
            {state.invalidToAmount && (
              <div className="mt-2 text-center text-red-500">
                取回的资产过少，请提高数量
              </div>
            )}
          </div>
        )}
      </div>

      <CurrencyPairSelectorModal
        open={state.openCurrencyPairSelectorModal}
        onClose={(currencyPair?: [string, string]) => {
          if (currencyPair) {
            state.currencyPair = currencyPair;
          }
          state.openCurrencyPairSelectorModal = false;
        }}
      />

      <style jsx>{`
        .remove-lp-detail.show {
          top: 238px;
        }
        .remove-lp-detail {
          top: 170px;
        }
      `}</style>
    </div>
  );
});
