import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { useStore } from 'store';
import { Finance, PrsAtm, sleep } from 'utils';
import classNames from 'classnames';
import Loading from 'components/Loading';
import WithdrawModal from './WithdrawModal';
import { add, equal, bignumber } from 'mathjs';
import CountUp from 'react-countup';

interface IAssetProps {
  asset: IAsset;
  onRecharge: (currency: string) => void;
  onWithdraw: (currency: string) => void;
  hideBorder?: boolean;
}

type IAsset = [string, string];

const Asset = (props: IAssetProps) => {
  const currency = props.asset[0];
  const amount = props.asset[1];

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
        <div className="w-10 h-10">
          <img
            className="w-10 h-10"
            src={
              Finance.currencyIconMap[currency] || Finance.defaultCurrencyIcon
            }
            alt={currency}
          />
        </div>
        <div className="flex items-center ml-4">
          <span className="font-bold mr-1 text-lg">
            <CountUp
              end={amount ? Finance.toNumber(amount) : 0}
              duration={1.5}
              decimals={amount ? Finance.getDecimalsFromAmount(amount) : 0}
            />
          </span>
          <span className="text-xs font-bold">
            {Finance.getCurrencyName(currency)}
          </span>
        </div>
      </div>
      <div className="flex items-center font-bold md:font-normal">
        <span
          className="text-blue-400 text-sm mr-3 cursor-pointer p-1"
          onClick={() => props.onRecharge(currency)}
        >
          转入
        </span>
        <span
          className="text-blue-400 text-sm cursor-pointer p-1"
          onClick={() => props.onWithdraw(currency)}
        >
          转出
        </span>
      </div>
    </div>
  );
};

const Assets = observer(() => {
  const { walletStore, snackbarStore, modalStore } = useStore();
  const { isEmpty, balance, loading } = walletStore;
  const state = useLocalStore(() => ({
    currency: '',
    openRechargeModal: false,
    openWithdrawModal: false,
  }));

  const onRecharge = (currency: string) => {
    state.currency = currency;
    modalStore.payment.show({
      title: '转入资产',
      currency: state.currency,
      getPaymentUrl: async (
        privateKey: string,
        accountName: string,
        amount: string,
        memo: string
      ) => {
        try {
          await PrsAtm.fetch({
            id: 'cancelPaymentRequest',
            actions: ['atm', 'cancelPaymentRequest'],
            args: [privateKey, accountName],
          });
        } catch (err) {}
        const resp: any = await PrsAtm.fetch({
          id: 'deposit',
          actions: ['atm', 'deposit'],
          args: [
            privateKey,
            accountName,
            null,
            amount,
            memo || Finance.defaultMemo.DEPOSIT,
          ],
        });
        return resp.paymentUrl;
      },
      checkResult: async (accountName: string, amount: string) => {
        const newBalance: any = await PrsAtm.fetch({
          id: 'getBalance',
          actions: ['account', 'getBalance'],
          args: [accountName],
        });
        const comparedAmount = add(
          bignumber(balance[state.currency]),
          bignumber(amount)
        );
        const isDone = equal(
          bignumber(newBalance[state.currency]),
          comparedAmount
        );
        if (isDone) {
          walletStore.setBalance(newBalance);
        }
        return isDone;
      },
      done: async () => {
        await sleep(1500);
        snackbarStore.show({
          message: '资产转入成功，流水账单将在 3-5 分钟之后生成',
          duration: 3000,
        });
      },
    });
  };

  const onWithdraw = (currency: string) => {
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
        Object.keys(balance).map((currency: string) => (
          <div key={currency}>
            <Asset
              asset={[currency, balance[currency] || '']}
              onRecharge={onRecharge}
              onWithdraw={onWithdraw}
              hideBorder={true}
            />
          </div>
        ))}
      {isEmpty && (
        <div className="py-20 text-center text-gray-af text-14">空空如也 ~</div>
      )}
      <WithdrawModal
        currency={state.currency}
        open={state.openWithdrawModal}
        onClose={async (done?: boolean) => {
          state.openWithdrawModal = false;
          if (done) {
            await sleep(1500);
            snackbarStore.show({
              message: `转出成功，可前往 Mixin 查看已到账的 ${state.currency}`,
              duration: 3000,
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
