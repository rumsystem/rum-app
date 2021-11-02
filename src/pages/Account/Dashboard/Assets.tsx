import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { useStore } from 'store';
import { Finance } from 'utils';
import classNames from 'classnames';

interface IProps {
  asset: IAsset;
  onRecharge: (currency: string) => void;
  onWithdraw: (currency: string) => void;
  hideBorder?: boolean;
}

type IAsset = [string, number];

const Asset = (props: IProps) => {
  const currency = props.asset[0];
  const amount = props.asset[1];

  return (
    <div
      className={classNames(
        {
          'border-b border-gray-300': !props.hideBorder,
        },
        'flex items-center justify-between py-3 px-2 leading-none'
      )}
    >
      <div className="flex items-center">
        <div className="w-10 h-10">
          <img
            className="w-10 h-10"
            src={Finance.currencyIconMap[currency]}
            alt={currency}
          />
        </div>
        <div className="flex items-center ml-4">
          <span className="font-bold mr-1 text-lg">{amount}</span>
          <span className="text-xs font-bold">{currency}</span>
        </div>
      </div>
      <div className="flex items-center font-bold md:font-normal">
        <span
          className="text-blue-400 text-sm mr-2 cursor-pointer p-1"
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

export default observer(() => {
  const { walletStore, snackbarStore } = useStore();
  const { isEmpty, balance, assets } = walletStore;

  const onRecharge = (currency: string) => {
    console.log(` ------------- onRecharge ---------------`);
    console.log({ currency });
  };

  const onWithdraw = (currency: string) => {
    if (Number(balance[currency]) === 0) {
      snackbarStore.show({
        message: '没有余额可提现哦',
        type: 'error',
      });
      return;
    }
    console.log(` ------------- onWithdraw ---------------`);
    console.log({ currency });
  };

  return (
    <div>
      {!isEmpty &&
        assets.map((asset, index) => (
          <div key={asset[0]}>
            <Asset
              asset={asset}
              onRecharge={onRecharge}
              onWithdraw={onWithdraw}
              hideBorder={assets.length === index + 1}
            />
          </div>
        ))}
      {isEmpty && (
        <div className="py-20 text-center text-gray-500 text-14">
          空空如也 ~
        </div>
      )}
    </div>
  );
});
