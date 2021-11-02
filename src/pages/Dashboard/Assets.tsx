import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { useStore } from 'store';
import { Finance, PrsAtm, sleep } from 'utils';
import classNames from 'classnames';
import Loading from 'components/Loading';
import WithdrawModal from './WithdrawModal';
import { add, equal, bignumber } from 'mathjs';
import CountUp from 'react-countup';
import { useHistory } from 'react-router-dom';
import Tooltip from '@material-ui/core/Tooltip';

interface IAssetProps {
  tokenCurrencyPairMap: any;
  asset: IAsset;
  onRecharge: (currency: string) => void;
  onWithdraw: (currency: string) => void;
  hideBorder?: boolean;
}

type IAsset = [string, string];

const Asset = (props: IAssetProps) => {
  const currency = props.asset[0];
  const amount = props.asset[1];
  const { tokenCurrencyPairMap } = props;
  const currencyPair = tokenCurrencyPairMap[currency];

  return (
    <div
      className={classNames(
        {
          'border-b border-gray-ec': !props.hideBorder,
        },
        'flex items-center justify-between p-3 leading-none'
      )}
    >
      <div className="flex items-center">
        {!currencyPair && (
          <div className="border-2 border-white rounded-full">
            <img
              className="w-10 h-10"
              src={
                Finance.currencyIconMap[currency] || Finance.defaultCurrencyIcon
              }
              alt={currency}
            />
          </div>
        )}
        {currencyPair && (
          <div className="flex items-center">
            <div className="border-2 border-white rounded-full z-20 relative">
              <img
                className="w-10 h-10"
                src={
                  Finance.currencyIconMap[currencyPair[0]] ||
                  Finance.defaultCurrencyIcon
                }
                alt={currencyPair[0]}
              />
            </div>
            <div className="border-2 border-white rounded-full -ml-5 z-10 relative">
              <img
                className="w-10 h-10"
                src={
                  Finance.currencyIconMap[currencyPair[1]] ||
                  Finance.defaultCurrencyIcon
                }
                alt={currencyPair[1]}
              />
            </div>
          </div>
        )}
        <div className="flex items-center ml-4">
          <span className="font-bold mr-1 text-lg">
            <CountUp
              end={amount ? Finance.toNumber(amount) : 0}
              duration={1.5}
              decimals={amount ? Finance.getDecimalsFromAmount(amount) : 0}
            />
          </span>
          <span className="text-xs font-bold">
            {currencyPair ? currencyPair.join('-') : ''}
          </span>
        </div>
      </div>
      <div className="flex items-center font-bold md:font-normal">
        <span
          className="text-blue-400 text-sm mr-3 cursor-pointer p-1"
          onClick={() => props.onRecharge(currency)}
        >
          {currencyPair ? '注入' : '转入'}
        </span>
        <Tooltip
          placement="top"
          disableHoverListener={!!currencyPair}
          title={`${
            currency === 'PRS'
              ? '为确保你的资产安全，当 24 小时内累计转出超过限额 20 万PRS，将触发人工审核。'
              : ''
          }如果转出超过 24 小时未收到 Mixin 到账信息，请联系工作人员`}
        >
          <span
            className="text-blue-400 text-sm cursor-pointer p-1"
            onClick={() => props.onWithdraw(currency)}
          >
            {currencyPair ? '赎回' : '转出'}
          </span>
        </Tooltip>
      </div>
    </div>
  );
};

const Assets = observer(() => {
  const {
    accountStore,
    walletStore,
    snackbarStore,
    modalStore,
    confirmDialogStore,
    poolStore,
  } = useStore();
  const { isEmpty, balance, loading } = walletStore;
  const history = useHistory();
  const state = useLocalStore(() => ({
    currency: '',
    openRechargeModal: false,
    openWithdrawModal: false,
  }));

  const onRecharge = (currency: string) => {
    if (poolStore.tokenCurrencyPairMap[currency]) {
      history.replace(`/swap?tab=lp&type=in&token=${currency}`);
      return;
    }
    state.currency = currency;
    let pendingAmount = '';
    modalStore.payment.show({
      title: '转入资产',
      currency: state.currency,
      pay: async (
        privateKey: string,
        accountName: string,
        amount: string,
        memo: string
      ) => {
        const pendingPaymentRequests: any = await PrsAtm.fetch({
          actions: ['atm', 'getAllPaymentRequest'],
          args: [accountName],
          for: 'getAllPaymentRequest',
          logging: true,
        });
        console.log({ pendingPaymentRequests });
        const pendingDepositPaymentRequest = pendingPaymentRequests.find(
          (request: any) => {
            return request.type === 'DEPOSIT';
          }
        );
        console.log({ pendingDepositPaymentRequest });
        if (pendingDepositPaymentRequest) {
          await new Promise((resolve, reject) => {
            confirmDialogStore.show({
              content: `<div class="px-3">你有一笔未完成的交易<br /> <div class="py-2 px-3 rounded-md bg-gray-f2 mt-3">充值 <strong><span class="text-18">${Finance.toString(
                pendingDepositPaymentRequest.amount
              )}</span> PRS<strong/></div> </div>`,
              okText: '去支付',
              cancelText: '取消它',
              ok: () => {
                resolve(true);
              },
              cancel: async () => {
                reject(new Error('cancel pending request'));
                confirmDialogStore.hide();
                try {
                  await PrsAtm.fetch({
                    actions: ['atm', 'cancelPaymentRequest'],
                    args: [privateKey, accountName],
                    for: 'beforeDeposit',
                    logging: true,
                  });
                } catch (err) {
                  console.log(err);
                }
                await sleep(200);
                snackbarStore.show({
                  message: '这笔交易已取消，你可以发起新的交易啦',
                  duration: 2500,
                });
              },
            });
          });
          confirmDialogStore.hide();
          await sleep(400);
          pendingAmount = Finance.toString(pendingDepositPaymentRequest.amount);
          return pendingDepositPaymentRequest.paymentUrl;
        }
        const resp: any = await PrsAtm.fetch({
          actions: ['atm', 'deposit'],
          args: [
            privateKey,
            accountName,
            null,
            amount,
            memo || Finance.defaultMemo.DEPOSIT,
          ],
          logging: true,
        });
        return resp.paymentUrl;
      },
      checkResult: async (accountName: string, amount: string) => {
        const newBalance: any = await PrsAtm.fetch({
          actions: ['account', 'getBalance'],
          args: [accountName],
          logging: true,
        });
        const comparedAmount = add(
          bignumber(balance[state.currency] || 0),
          bignumber(pendingAmount || amount)
        );
        const isDone = equal(
          bignumber(newBalance[state.currency] || 0),
          comparedAmount
        );
        if (isDone) {
          walletStore.setBalance(newBalance);
        }
        return isDone;
      },
      done: async () => {
        await sleep(800);
        1;
        snackbarStore.show({
          message: '资产转入成功',
        });
      },
    });
  };

  const onWithdraw = (currency: string) => {
    if (!accountStore.account.bound_mixin_profile) {
      snackbarStore.show({
        message: '请先绑定 Mixin 账号',
        type: 'error',
      });
      return;
    }
    if (poolStore.tokenCurrencyPairMap[currency]) {
      history.replace(`/swap?tab=lp&type=out&token=${currency}`);
      return;
    }
    if (Number(balance[currency]) === 0) {
      snackbarStore.show({
        message: '没有余额可提现哦',
        type: 'error',
      });
      return;
    }
    state.currency = currency;
    state.openWithdrawModal = true;
  };

  if (loading) {
    return (
      <div className="py-8">
        <Loading />
      </div>
    );
  }

  return (
    <div>
      {!isEmpty &&
        Object.keys(balance).map((currency: string) => {
          return (
            <div key={currency}>
              <Asset
                tokenCurrencyPairMap={poolStore.tokenCurrencyPairMap}
                asset={[currency, balance[currency] || '']}
                onRecharge={onRecharge}
                onWithdraw={onWithdraw}
                hideBorder={true}
              />
            </div>
          );
        })}
      {isEmpty && (
        <div className="py-20 text-center text-gray-af text-14">空空如也 ~</div>
      )}
      <WithdrawModal
        currency={state.currency}
        open={state.openWithdrawModal}
        onClose={async (done?: boolean) => {
          state.openWithdrawModal = false;
          if (done) {
            await sleep(500);
            confirmDialogStore.show({
              content: `转出成功，可前往 Mixin 查看已到账的 ${state.currency}`,
              okText: '我知道了',
              ok: () => confirmDialogStore.hide(),
              cancelDisabled: true,
            });
          }
        }}
      />
    </div>
  );
});

interface IProps {
  minHeight: number;
}

export default observer((props: IProps) => {
  const { accountStore, walletStore } = useStore();

  React.useEffect(() => {
    (async () => {
      try {
        const balance: any = await PrsAtm.fetch({
          actions: ['account', 'getBalance'],
          args: [accountStore.account.account_name],
        });
        walletStore.setBalance(balance);
      } catch (err) {}
    })();
  }, []);

  return (
    <div className="bg-white rounded-12 text-gray-6d">
      <div className="px-5 pt-4 pb-3 leading-none text-16 border-b border-gray-ec flex justify-between items-center">
        资产
      </div>
      <div
        className="px-5 py-2"
        style={{
          minHeight: props.minHeight,
        }}
      >
        <Assets />
      </div>
    </div>
  );
});
