import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { MdSwapVert } from 'react-icons/md';
import { BiChevronDown } from 'react-icons/bi';
import Button from 'components/Button';
import { TextField } from '@material-ui/core';
import classNames from 'classnames';
import CurrencySelectorModal from './CurrencySelectorModal';
import { Finance, PrsAtm, sleep } from 'utils';
import { divide, bignumber } from 'mathjs';
import { isEmpty, debounce } from 'lodash';
import { useStore } from 'store';

interface IDryRunResult {
  amount: string;
  chainAccount: string;
  currency: string;
  memo: string;
  notification: any;
  pool: string;
  rate: string;
  receiver: string;
  slippage: string;
  swap_fee: string;
  swap_fee_rate: string;
  to_amount: string;
  to_currency: string;
  price_impact: string;
}

interface ISwapResult {
  amount: string;
  chainAccount: string;
  currency: string;
  memo: string;
  notification: any;
  pool: string;
  rate: string;
  receiver: string;
  slippage: string;
  swap_fee: string;
  swap_fee_rate: string;
  to_amount: string;
  to_currency: string;
  price_impact: string;
  payment_request: {
    payment_request: {
      [uuid: string]: {
        amount: string;
        currency: string;
        payment_url: string;
      };
    };
  };
}

export default observer(() => {
  const { poolStore, modalStore, confirmDialogStore } = useStore();
  const state = useLocalStore(() => ({
    dryRunning: false,
    focusOn: 'from',
    fromCurrency: '',
    fromAmount: '',
    toCurrency: '',
    toAmount: '',
    openCurrencySelectorModal: false,
    showDryRunResult: false,
    dryRunResult: {} as IDryRunResult,
    get hasDryRunResult() {
      return !isEmpty(this.dryRunResult);
    },
  }));

  React.useEffect(() => {
    (async () => {
      const [fromCurrency = '', toCurrency = ''] = poolStore.currencies;
      state.fromCurrency = fromCurrency;
      state.toCurrency = toCurrency;
    })();
  }, [state, poolStore]);

  const dryRun = async () => {
    if (!state.fromAmount) {
      state.showDryRunResult = false;
      state.dryRunResult = {} as IDryRunResult;
      state.toAmount = '';
      return;
    }
    state.showDryRunResult = false;
    state.dryRunning = true;
    try {
      const resp: any = await PrsAtm.fetch({
        id: 'swapToken.dryrun',
        actions: ['exchange', 'swapToken'],
        args: [
          null,
          null,
          state.fromCurrency,
          state.fromAmount,
          state.toCurrency,
          '',
          null,
          null,
          { dryrun: true },
        ],
        minPending: 600,
      });
      state.dryRunResult = resp as IDryRunResult;
      state.showDryRunResult = true;
      if (state.focusOn === 'from') {
        state.toAmount = Finance.toString(state.dryRunResult.to_amount);
      } else {
        state.fromAmount = Finance.toString(state.dryRunResult.amount);
      }
    } catch (err) {
      state.dryRunResult = {} as IDryRunResult;
      console.log(err);
    }
    state.dryRunning = false;
  };

  const inputChangeDryRun = React.useCallback(debounce(dryRun, 500), []);

  const submit = async () => {
    modalStore.quickPayment.show({
      amount: state.fromAmount,
      currency: state.fromCurrency,
      pay: async (privateKey: string, accountName: string) => {
        try {
          await PrsAtm.fetch({
            id: 'exchange.cancelSwap',
            actions: ['exchange', 'cancelSwap'],
            args: [privateKey, accountName],
          });
        } catch (err) {}
        try {
          await PrsAtm.fetch({
            id: 'cancelPaymentRequest',
            actions: ['atm', 'cancelPaymentRequest'],
            args: [privateKey, accountName],
          });
        } catch (err) {}
        const resp: any = await PrsAtm.fetch({
          id: 'swapToken',
          actions: ['exchange', 'swapToken'],
          args: [
            privateKey,
            accountName,
            state.fromCurrency,
            state.fromAmount,
            state.toCurrency,
            '',
            null,
            null,
          ],
          minPending: 600,
        });
        const swapResult: ISwapResult = resp;
        return Object.values(swapResult.payment_request.payment_request)[0]
          .payment_url;
      },
      checkResult: async () => {
        await sleep(3000);
        return true;
      },
      done: async () => {
        await sleep(200);
        state.fromAmount = '';
        state.toAmount = '';
        state.showDryRunResult = false;
        confirmDialogStore.show({
          content: `兑换成功，${state.toCurrency} 即将转入你的 Mixin 钱包，可前往 Mixin 查看`,
          okText: '我知道了',
          ok: () => confirmDialogStore.hide(),
          cancelDisabled: true,
        });
      },
    });
  };

  return (
    <div className="flex justify-center pt-10 exchanger">
      <div className="w-80 relative">
        <div className="bg-white rounded-12 p-8 px-8 shadow-lg text-gray-70 font-bold z-10 relative">
          <div>支付</div>
          <div className="mt-1 flex items-center justify-between">
            <div
              className="font-bold flex items-center text-22 cursor-pointer"
              onClick={() => {
                state.focusOn = 'from';
                state.openCurrencySelectorModal = true;
              }}
            >
              {state.fromCurrency}
              <BiChevronDown className="text-18 ml-1" />
            </div>
            <div className="w-32 -mt-2">
              <TextField
                autoFocus
                value={state.fromAmount}
                onChange={(e) => {
                  state.fromAmount = e.target.value;
                  inputChangeDryRun();
                }}
                margin="dense"
                variant="outlined"
              />
            </div>
          </div>
          <div className="py-3">
            <div
              className="text-22 w-10 h-10 flex items-center justify-center rounded-full border border-gray-ec shadow cursor-pointer"
              onClick={() => {
                const { fromCurrency } = state;
                state.fromCurrency = state.toCurrency;
                state.toCurrency = fromCurrency;
                if (state.focusOn === 'from') {
                  state.fromAmount = state.toAmount;
                  state.toAmount = '';
                } else {
                  state.toAmount = state.fromAmount;
                  state.fromAmount = '';
                }
                dryRun();
              }}
            >
              <MdSwapVert />
            </div>
          </div>
          <div className="mt-3">获得</div>
          <div className="mt-1 flex items-center justify-between">
            <div
              className="font-bold flex items-center text-22 cursor-pointer"
              onClick={() => {
                state.focusOn = 'to';
                state.openCurrencySelectorModal = true;
              }}
            >
              {state.toCurrency}
              <BiChevronDown className="text-18 ml-1" />
            </div>
            <div className="w-32 -mt-2">
              <TextField
                value={state.toAmount}
                disabled
                margin="dense"
                variant="outlined"
              />
            </div>
          </div>
          <div className="mt-5">
            <Button
              fullWidth
              isDoing={state.dryRunning}
              hideText={state.dryRunning}
              color={state.showDryRunResult ? 'primary' : 'gray'}
              onClick={submit}
            >
              兑换
            </Button>
          </div>
        </div>
        <div
          className={classNames(
            {
              show: state.showDryRunResult,
            },
            'z-0 absolute bottom-0 left-0 detail w-full duration-500 ease-in-out transition-all'
          )}
        >
          {state.hasDryRunResult && (
            <div className="bg-white bg-opacity-75 text-12 px-6 pt-8 pb-4 leading-none mx-4 rounded-12 rounded-t-none">
              <div className="flex items-center justify-between mt-2">
                <div className="text-gray-88">价格</div>
                <div className="text-gray-70 font-bold">
                  1 {state.fromCurrency} ={' '}
                  {Finance.toString(
                    divide(
                      bignumber(state.dryRunResult.to_amount),
                      bignumber(state.dryRunResult.amount)
                    )
                  )}{' '}
                  {state.toCurrency}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-gray-88">手续费</div>
                <div className="text-gray-70 font-bold">
                  {Finance.toString(state.dryRunResult.swap_fee)}{' '}
                  {state.fromCurrency}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="text-gray-88">价格影响</div>
                <div className="text-gray-70 font-bold">
                  {state.dryRunResult.price_impact}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <CurrencySelectorModal
        currentCurrency={
          state.focusOn === 'from' ? state.fromCurrency : state.toCurrency
        }
        disabledCurrency={
          state.focusOn === 'from' ? state.toCurrency : state.fromCurrency
        }
        open={state.openCurrencySelectorModal}
        onClose={(currency?: string) => {
          if (currency) {
            if (state.focusOn === 'from') {
              state.fromCurrency = currency;
              state.fromAmount = '';
            } else {
              state.toCurrency = currency;
              state.toAmount = '';
            }
          }
          state.openCurrencySelectorModal = false;
        }}
      />
      <style jsx>{`
        .detail.show {
          bottom: -85px;
        }
        .detail {
          bottom: 0;
        }
      `}</style>
      <style jsx global>{`
        .exchanger .MuiInputBase-root {
          font-weight: bold;
          color: #707070;
        }
        .exchanger .MuiInputBase-root.Mui-disabled {
          color: #707070;
        }
      `}</style>
    </div>
  );
});
