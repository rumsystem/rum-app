import React from 'react';
import { runInAction } from 'mobx';
import { observer, useLocalStore } from 'mobx-react-lite';
import { MdSwapVert } from 'react-icons/md';
import { BiChevronDown } from 'react-icons/bi';
import Button from 'components/Button';
import { TextField } from '@material-ui/core';
import classNames from 'classnames';
import CurrencySelectorModal from './CurrencySelectorModal';
import { Finance, PrsAtm, sleep } from 'utils';
import { isEmpty, debounce } from 'lodash';
import { useStore } from 'store';
import finance from 'utils/finance';

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
  /** 提交时的toAmount */
  original_to_amount?: string;
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
  const {
    poolStore,
    modalStore,
    confirmDialogStore,
    snackbarStore,
    accountStore,
  } = useStore();
  const state = useLocalStore(() => ({
    dryRunning: false,
    focusOn: 'from',
    fromCurrency: '',
    fromAmount: '',
    toCurrency: '',
    toAmount: '',
    dryRunMode: 'forward' as 'forward' | 'reverse',
    openCurrencySelectorModal: false,
    invalidFromAmount: false,
    invalidToAmount: false,
    invalidFee: false,
    showDryRunResult: false,
    dryRunResult: {} as IDryRunResult,
    get hasDryRunResult() {
      return !isEmpty(this.dryRunResult);
    },
    get canDryRun() {
      if (state.dryRunMode === 'forward') {
        return (
          state.fromAmount &&
          finance.largerEqMinNumber(
            state.fromAmount,
            Finance.exchangeCurrencyMinNumber[state.fromCurrency]
          )
        );
      }

      return (
        state.toAmount &&
        finance.largerEqMinNumber(
          state.toAmount,
          Finance.exchangeCurrencyMinNumber[state.toCurrency]
        )
      );
    },
    get canSubmit() {
      return (
        this.showDryRunResult &&
        !this.invalidToAmount &&
        !this.invalidFee &&
        finance.largerEqMinNumber(
          state.fromAmount,
          Finance.exchangeCurrencyMinNumber[state.fromCurrency]
        ) &&
        finance.largerEqMinNumber(
          state.toAmount,
          Finance.exchangeCurrencyMinNumber[state.toCurrency]
        )
      );
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
    state.showDryRunResult = false;
    state.dryRunning = true;
    const reverse = state.dryRunMode === 'reverse'
    const fromAmount = state.fromAmount.trim();
    const toAmount = state.toAmount.trim();
    const fromCurrency = state.fromCurrency;
    const toCurrency = state.toCurrency;

    if ((!reverse && !fromAmount) || (reverse && !toAmount)) {
      state.showDryRunResult = false;
      state.dryRunResult = {} as IDryRunResult;
      return;
    }

    try {
      const resp: any = await PrsAtm.fetch({
        actions: ['exchange', 'swapToken'],
        args: [
          null,
          null,
          fromCurrency,
          reverse
            ? toAmount
            : fromAmount,
          toCurrency,
          '',
          null,
          null,
          { dryrun: true, reverse, },
        ],
        minPending: 600,
        logging: true,
      });
      state.dryRunResult = resp as IDryRunResult;
      if (reverse) {
        state.dryRunResult.original_to_amount = toAmount;
      }
      state.showDryRunResult = true;

      const validFromAmount = !!Finance.largerEqMinNumber(
        state.dryRunResult.amount,
        Finance.exchangeCurrencyMinNumber[fromCurrency]
      );
      const validToAmount = !!Finance.largerEqMinNumber(
        state.dryRunResult.to_amount,
        Finance.exchangeCurrencyMinNumber[toCurrency]
      );

      if (validFromAmount && validToAmount) {
        state.fromAmount = Finance.toString(state.dryRunResult.amount);
        state.toAmount = Finance.toString(state.dryRunResult.to_amount);
      } else if (!reverse) {
        state.toAmount = '';
      } else {
        state.fromAmount = '';
      }

      state.invalidFromAmount = !validFromAmount;
      state.invalidToAmount = !validToAmount;
      const invalidFee = !!Finance.largerEqMinNumber(
        state.dryRunResult.swap_fee,
        '0.0001'
      );

      state.invalidFee = !invalidFee;
    } catch (err) {
      state.dryRunResult = {} as IDryRunResult;
      console.log(err.message);
    }
    state.dryRunning = false;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, type: 'from' | 'to') => {
    const value = e.target.value;
    if (!Finance.isValidAmount(value)) {
      return;
    }
    const formatAmount = Finance.formatInputAmount(value);
    const minCurrency = type === 'from'
      ? Finance.exchangeCurrencyMinNumber[state.fromCurrency]
      : Finance.exchangeCurrencyMinNumber[state.toCurrency];

    if (formatAmount && !finance.largerEqMinNumber(formatAmount, minCurrency)) {
      snackbarStore.show({
        message: `数量不能小于 ${minCurrency}`,
        type: 'error',
      });
      return;
    }

    runInAction(() => {
      if (type === 'from') {
        state.fromAmount = value;
        state.dryRunMode = 'forward';
      } else {
        state.toAmount = value;
        state.dryRunMode = 'reverse';
      }
    })

    if (state.canDryRun) {
      inputChangeDryRun();
    }
  };

  const inputChangeDryRun = React.useCallback(debounce(dryRun, 400), []);

  const submit = async () => {
    if (!accountStore.isLogin) {
      modalStore.auth.show();
      return;
    }
    modalStore.quickPayment.show({
      amount: state.fromAmount,
      currency: state.fromCurrency,
      pay: async (privateKey: string, accountName: string) => {
        try {
          await PrsAtm.fetch({
            actions: ['exchange', 'cancelSwap'],
            args: [privateKey, accountName],
            logging: true,
          });
          await sleep(1000);
        } catch (err) {}
        let resp: any
        try {
          resp = await PrsAtm.fetch({
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
            logging: true,
          });
        } catch (err) {
          if (/token overdraw/.exec(err.message)) {
            throw new Error('兑换超出兑换池最大额度，请重新输入')
          }
          throw err
        }

        const swapResult: ISwapResult = resp
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
          content: `支付成功后，${state.toCurrency} 将转入你的 Mixin 钱包，可前往 Mixin 查看`,
          okText: '我知道了',
          ok: () => confirmDialogStore.hide(),
          cancelDisabled: true,
        });
        (async () => {
          try {
            await sleep(5000);
            const resp: any = await PrsAtm.fetch({
              actions: ['swap', 'getAllPools'],
            });
            poolStore.setPools(resp);
          } catch (err) {}
        })();
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
                onChange={(e) => handleInputChange(e, 'from')}
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
                state.fromAmount = state.toAmount;
                state.toAmount = '';
                state.dryRunMode = 'forward'
                if (state.canDryRun) {
                  dryRun();
                }
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
                onChange={(e) => handleInputChange(e, 'to')}
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
              color={state.canSubmit ? 'primary' : 'gray'}
              onClick={() => state.canSubmit && submit()}
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
              {!state.invalidToAmount && !state.invalidFee && (
                <div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-gray-88">价格</div>
                    <div className="text-gray-70 font-bold">
                      <div>
                        1 {state.dryRunResult.currency} ={' '}
                        {Finance.formatWithPrecision(
                          state.dryRunResult.rate,
                          4
                        )}{' '}
                        {state.dryRunResult.to_currency}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-gray-88">手续费</div>
                    <div className="text-gray-70 font-bold">
                      {Finance.formatWithPrecision(
                        state.dryRunResult.swap_fee,
                        4
                      )}{' '}
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
              {state.invalidToAmount && state.dryRunMode === 'forward' && (
                <div className="mt-2 text-center text-red-500">
                  <div>
                    {Finance.toString(state.dryRunResult.amount)}{' '}
                    {state.dryRunResult.currency} 能兑换到的{' '}
                    {state.dryRunResult.to_currency} 过少
                  </div>
                  <div className="mt-2">
                    请提高 {state.dryRunResult.currency} 的数量
                  </div>
                </div>
              )}
              {state.invalidFromAmount && state.dryRunMode === 'reverse' && (
                <div className="mt-2 text-center text-red-500">
                  <div>
                    兑换 {Finance.toString(state.dryRunResult.original_to_amount ?? state.dryRunResult.to_amount)}{' '}
                    {state.dryRunResult.to_currency} 所需要的{' '}
                    {state.dryRunResult.currency} 过少
                  </div>
                  <div className="mt-2">
                    请提高 {state.dryRunResult.to_currency} 的数量
                  </div>
                </div>
              )}
              {state.invalidFee && !state.invalidFromAmount && !state.invalidToAmount && (
                <div className="mt-2 text-center text-red-500">
                  <div>
                    {Finance.toString(state.dryRunResult.amount)}{' '}
                    {state.dryRunResult.currency} 数量过少
                  </div>
                  <div className="mt-2">无法支付有效的手续费</div>
                  <div className="mt-2">
                    请提高 {state.dryRunResult.currency} 的数量
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <CurrencySelectorModal
        focusOn={state.focusOn}
        fromCurrency={state.fromCurrency}
        open={state.openCurrencySelectorModal}
        onClose={(currency?: string) => {
          if (currency) {
            if (state.focusOn === 'from' && state.fromCurrency === currency) {
              state.openCurrencySelectorModal = false;
              return;
            }
            if (state.focusOn === 'to' && state.toCurrency === currency) {
              state.openCurrencySelectorModal = false;
              return;
            }
            state.fromAmount = '';
            state.toAmount = '';
            if (state.focusOn === 'from') {
              state.fromCurrency = currency;
              if (
                !poolStore.swapToMap[state.fromCurrency].includes(
                  state.toCurrency
                )
              ) {
                state.toCurrency = poolStore.swapToMap[state.fromCurrency][0];
              }
            } else {
              state.toCurrency = currency;
            }
          }
          state.openCurrencySelectorModal = false;
        }}
      />
      <style jsx>{`
        .detail.show {
          top: 312px;
        }
        .detail {
          top: 230px;
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
