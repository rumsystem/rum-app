import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { BiChevronDown, BiArrowBack } from 'react-icons/bi';
import Button from 'components/Button';
import { TextField } from '@material-ui/core';
import classNames from 'classnames';
import CurrencySelectorModal from '../CurrencySelectorModal';
import { Finance, PrsAtm, sleep, getQuery, removeQuery } from 'utils';
import { larger } from 'mathjs';
import { isEmpty, debounce } from 'lodash';
import { useStore } from 'store';
import Fade from '@material-ui/core/Fade';
import { MdHelp } from 'react-icons/md';
import Tooltip from '@material-ui/core/Tooltip';

interface IDryRunResult {
  amount_a: string;
  amount_b: string;
  chainAccount: string;
  currency_a: string;
  currency_b: string;
  memo: string;
  notification: any;
  pool: string;
  receiver: string;
}

interface IAddLiquidResult {
  amount_a: string;
  amount_b: string;
  chainAccount: string;
  currency_a: string;
  currency_b: string;
  memo: string;
  notification: any;
  pool: string;
  receiver: string;
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
    walletStore,
    confirmDialogStore,
    snackbarStore,
    accountStore,
  } = useStore();
  const state = useLocalStore(() => ({
    step: 1,
    dryRunning: false,
    submitting: false,
    checking: false,
    focusOn: 'a',
    currencyA: '',
    amountA: '',
    currencyB: '',
    amountB: '',
    paidA: false,
    paidB: false,
    openCurrencySelectorModal: false,
    accountName: '',
    invalidAmount: false,
    showDryRunResult: false,
    dryRunResult: {} as IDryRunResult,
    addLiquidResult: {} as IAddLiquidResult,
    get hasDryRunResult() {
      return !isEmpty(this.dryRunResult);
    },
  }));

  React.useEffect(() => {
    (async () => {
      if (getQuery('token')) {
        const [currencyA = '', currencyB = ''] = poolStore.tokenCurrencyPairMap[
          getQuery('token')
        ];
        state.currencyA = currencyA;
        state.currencyB = currencyB;
        removeQuery('token');
      } else {
        const [currencyA = '', currencyB = ''] = poolStore.currencyPairs[0];
        state.currencyA = currencyA;
        state.currencyB = currencyB;
      }
    })();
  }, [state, poolStore]);

  React.useEffect(() => {
    return () => {
      PrsAtm.tryCancelPolling();
    };
  }, []);

  const dryRun = async () => {
    state.showDryRunResult = false;
    state.dryRunning = true;
    try {
      const resp: any = await PrsAtm.fetch({
        actions: ['exchange', 'addLiquid'],
        args: [
          null,
          null,
          state.focusOn === 'a' ? state.currencyA : state.currencyB,
          state.focusOn === 'a' ? state.amountA : state.amountB,
          state.focusOn === 'a' ? state.currencyB : state.currencyA,
          null,
          null,
          { dryrun: true },
        ],
        minPending: 600,
        logging: true,
      });
      state.dryRunResult = resp as IDryRunResult;
      state.showDryRunResult = true;
      if (state.focusOn === 'a') {
        state.amountB = Finance.toString(state.dryRunResult.amount_b);
      } else {
        state.amountA = Finance.toString(state.dryRunResult.amount_b);
      }
      state.invalidAmount =
        !Finance.largerEqMinNumber(
          state.dryRunResult.amount_a,
          Finance.exchangeCurrencyMinNumber[state.dryRunResult.amount_a]
        ) ||
        !Finance.largerEqMinNumber(
          state.dryRunResult.amount_b,
          Finance.exchangeCurrencyMinNumber[state.dryRunResult.amount_b]
        );
    } catch (err) {
      state.dryRunResult = {} as IDryRunResult;
      console.log(err.message);
    }
    state.dryRunning = false;
  };

  const inputChangeDryRun = React.useCallback(debounce(dryRun, 400), []);

  const submit = () => {
    if (!accountStore.isLogin) {
      modalStore.auth.show();
      return;
    }
    modalStore.verification.show({
      pass: (privateKey: string, accountName: string) => {
        state.accountName = accountName;
        (async () => {
          state.submitting = true;
          try {
            const balance: any = await PrsAtm.fetch({
              actions: ['account', 'getBalance'],
              args: [state.accountName],
            });
            walletStore.setBalance(balance);
          } catch (err) {}
          try {
            await PrsAtm.fetch({
              actions: ['exchange', 'cancelSwap'],
              args: [privateKey, accountName],
              for: 'beforeAddLiquid',
              logging: true,
            });
            await sleep(1000);
          } catch (err) {}
          try {
            const resp: any = await PrsAtm.fetch({
              actions: ['exchange', 'addLiquid'],
              args: [
                privateKey,
                accountName,
                state.currencyA,
                state.amountA,
                state.currencyB,
                null,
                null,
              ],
              minPending: 600,
              logging: true,
            });
            state.addLiquidResult = resp as IAddLiquidResult;
            state.step = 2;
          } catch (err) {
            console.log(err.message);
          }
          state.submitting = false;
        })();
      },
    });
  };

  const done = async () => {
    state.checking = true;
    PrsAtm.polling(async () => {
      try {
        const balance: any = await PrsAtm.fetch({
          actions: ['account', 'getBalance'],
          args: [state.accountName],
          for: 'afterAddLiquid',
          logging: true,
        });
        const currencyPair = poolStore
          .getCurrencyPair(state.currencyA, state.currencyB)
          .join('');
        if (
          larger(
            balance[currencyPair] || '0',
            walletStore.balance[currencyPair] || '0'
          )
        ) {
          state.checking = false;
          state.step = 1;
          state.showDryRunResult = false;
          state.amountA = '';
          state.amountB = '';
          state.paidA = false;
          state.paidB = false;
          walletStore.setBalance(balance);
          confirmDialogStore.show({
            content: `注入成功。${currencyPair} 交易对已经转入你的资产`,
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
          return true;
        }
        return false;
      } catch (err) {
        return false;
      }
    }, 5000);
  };

  const payA = async () => {
    modalStore.quickPayment.show({
      skipVerification: true,
      amount: state.addLiquidResult.amount_a,
      currency: state.addLiquidResult.currency_a,
      pay: async () => {
        return Object.values(
          state.addLiquidResult.payment_request.payment_request
        )[0].payment_url;
      },
      checkResult: async () => {
        await sleep(1000);
        return true;
      },
      done: async () => {
        await sleep(500);
        state.paidA = true;
      },
    });
  };

  const payB = async () => {
    modalStore.quickPayment.show({
      skipVerification: true,
      amount: state.addLiquidResult.amount_b,
      currency: state.addLiquidResult.currency_b,
      pay: async () => {
        return Object.values(
          state.addLiquidResult.payment_request.payment_request
        )[1].payment_url;
      },
      checkResult: async () => {
        await sleep(1000);
        return true;
      },
      done: async () => {
        await sleep(500);
        state.paidB = true;
      },
    });
  };

  const step1 = () => (
    <div>
      <div className="flex items-center justify-between">
        <div
          className="font-bold flex items-center text-22 cursor-pointer"
          onClick={() => {
            state.focusOn = 'a';
            state.openCurrencySelectorModal = true;
          }}
        >
          {state.currencyA}
          <BiChevronDown className="text-18 ml-1" />
        </div>
        <div className="w-32 -mt-2">
          <TextField
            autoFocus
            value={state.amountA}
            onChange={(e) => {
              state.focusOn = 'a';
              const { value } = e.target;
              if (Finance.isValidAmount(value)) {
                const formatAmount = Finance.formatInputAmount(value);
                if (
                  formatAmount &&
                  !Finance.largerEqMinNumber(
                    formatAmount,
                    Finance.exchangeCurrencyMinNumber[state.currencyA]
                  )
                ) {
                  snackbarStore.show({
                    message: `数量不能小于 ${
                      Finance.exchangeCurrencyMinNumber[state.currencyA]
                    }`,
                    type: 'error',
                  });
                  return;
                }
                state.amountA = value;
                inputChangeDryRun();
              }
            }}
            margin="dense"
            variant="outlined"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div
          className="font-bold flex items-center text-22 cursor-pointer"
          onClick={() => {
            state.focusOn = 'to';
            state.openCurrencySelectorModal = true;
          }}
        >
          {state.currencyB}
          <BiChevronDown className="text-18 ml-1" />
        </div>
        <div className="w-32 -mt-2">
          <TextField
            value={state.amountB}
            onChange={(e) => {
              state.focusOn = 'b';
              const { value } = e.target;
              if (Finance.isValidAmount(value)) {
                const formatAmount = Finance.formatInputAmount(value);
                if (
                  formatAmount &&
                  !Finance.largerEqMinNumber(
                    formatAmount,
                    Finance.exchangeCurrencyMinNumber[state.currencyB]
                  )
                ) {
                  snackbarStore.show({
                    message: `数量不能小于 ${
                      Finance.exchangeCurrencyMinNumber[state.currencyB]
                    }`,
                    type: 'error',
                  });
                  return;
                }
                state.amountB = value;
                inputChangeDryRun();
              }
            }}
            margin="dense"
            variant="outlined"
          />
        </div>
      </div>
      <div className="mt-6">
        <Button
          fullWidth
          isDoing={state.dryRunning || state.submitting}
          hideText={state.dryRunning}
          color={
            state.showDryRunResult && !state.invalidAmount ? 'primary' : 'gray'
          }
          onClick={() =>
            state.showDryRunResult && !state.invalidAmount && submit()
          }
        >
          确定
        </Button>
        <div className="mt-2">
          <Tooltip
            placement="top"
            title="为资金池注入流动性，需要你按照当前兑换率提供两种币，你将得到凭证；可随时按彼时兑换率赎回两种币，根据你提供的流动性占比获得手续费分成。流动性提供者的实际收益，是价格差异引起的背离损失与交易累积手续费之间的平衡。如你尚未理解收益及风险，请勿大额注入"
          >
            <div className="flex items-center justify-center text-gray-bf text-12">
              <MdHelp className="text-16 mr-1" />
              流动性挖矿的收益与风险？
            </div>
          </Tooltip>
        </div>
      </div>
    </div>
  );

  const step2 = () => (
    <div className="relative">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <img
            src={Finance.currencyIconMap[state.currencyA]}
            alt="icon"
            className="rounded-full w-8 h-8 relative z-0"
          />
          <div className="text-15 ml-3 font-bold">
            {state.amountA} {state.currencyA}
          </div>
        </div>
        <Button
          size="small"
          outline
          onClick={payA}
          isDone={state.paidA}
          fixedDone
        >
          支付
        </Button>
      </div>
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center">
          <img
            src={Finance.currencyIconMap[state.currencyB]}
            alt="icon"
            className="rounded-full w-8 h-8 relative z-0"
          />
          <div className="text-15 ml-3 font-bold">
            {state.amountB} {state.currencyB}
          </div>
        </div>
        <Button
          size="small"
          outline
          onClick={payB}
          isDone={state.paidB}
          fixedDone
        >
          支付
        </Button>
      </div>
      <div className="mt-5 text-gray-bd leading-normal text-12">
        分别支付两个币种，然后点击完成。你会获得
        {poolStore
          .getCurrencyPair(state.currencyA, state.currencyB)
          .join('-')}{' '}
        交易对作为流动性证明，之后你随时可以用交易对换回这两个币种。
      </div>
      <div className="mt-4">
        <Button
          fullWidth
          isDoing={state.checking}
          color={
            state.showDryRunResult && state.paidA && state.paidB
              ? 'primary'
              : 'gray'
          }
          onClick={done}
        >
          {state.checking ? '核对支付结果' : '完成'}
        </Button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="bg-white rounded-12 shadow-lg text-gray-70 font-bold z-10 relative">
        <div className="pb-16 mb-2" />
        <div className="px-8 pb-6">
          <Fade in={true} timeout={500}>
            <div>
              {state.step === 1 && (
                <div>
                  <Fade in={true} timeout={500}>
                    <div>{step1()}</div>
                  </Fade>
                </div>
              )}
              {state.step === 2 && (
                <div>
                  <Fade in={true} timeout={500}>
                    <div>{step2()}</div>
                  </Fade>
                </div>
              )}
            </div>
          </Fade>
        </div>
      </div>
      {state.step === 2 && (
        <div
          className="px-4 text-20 cursor-pointer pr-5 h-12 flex items-center absolute top-0 left-0 w-full bg-white z-30 border-b border-gray-ec text-gray-88"
          onClick={() => {
            state.step = 1;
          }}
        >
          <BiArrowBack />
        </div>
      )}
      <div
        className={classNames(
          {
            show: state.showDryRunResult,
          },
          'z-0 absolute bottom-0 left-0 add-lp-detail w-full duration-500 ease-in-out transition-all'
        )}
      >
        {state.hasDryRunResult && (
          <div className="bg-white bg-opacity-75 text-12 px-6 pt-8 pb-4 leading-none mx-4 rounded-12 rounded-t-none">
            <div className="flex items-center justify-between mt-2">
              <div className="text-gray-88">注入比例</div>
              <div className="text-gray-70 font-bold">
                1 {state.currencyA} ={' '}
                {Finance.formatWithPrecision(
                  poolStore.rateMap[`${state.currencyA}${state.currencyB}`],
                  4
                )}{' '}
                {state.currencyB}
              </div>
            </div>
          </div>
        )}
      </div>
      <CurrencySelectorModal
        focusOn={state.focusOn === 'a' ? 'from' : 'to'}
        fromCurrency={state.currencyA}
        open={state.openCurrencySelectorModal}
        onClose={(currency?: string) => {
          if (currency) {
            if (state.focusOn === 'a' && state.currencyA === currency) {
              state.openCurrencySelectorModal = false;
              return;
            }
            if (state.focusOn === 'b' && state.currencyB === currency) {
              state.openCurrencySelectorModal = false;
              return;
            }
            state.amountA = '';
            state.amountB = '';
            if (state.focusOn === 'a') {
              state.currencyA = currency;
              if (
                !poolStore.swapToMap[state.currencyA].includes(state.currencyB)
              ) {
                state.currencyB = poolStore.swapToMap[state.currencyA][0];
              }
            } else {
              state.currencyB = currency;
            }
          }
          state.openCurrencySelectorModal = false;
        }}
      />
      <style jsx>{`
        .add-lp-detail.show {
          bottom: -45px;
        }
        .add-lp-detail {
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
