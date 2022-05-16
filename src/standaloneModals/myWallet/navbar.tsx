import React from 'react';

import { lang } from 'utils/lang';
import ReturnIcon from 'assets/iconReturn.svg';
import Button from 'components/Button';
import openDepositModal from './openDepositModal';
import openWithdrawModal from './openWithdrawModal';
import openTransactionsModal from './openTransactionsModal';

interface Props {
  onClose: () => void
}

export default (props: Props) => {
  const {
    onClose,
  } = props;

  return (
    <div
      className="flex items-center h-[70px] bg-white drop-shadow-md"
    >
      <div
        className="ml-10 flex gap-x-3 justify-center items-center text-16 cursor-pointer"
        data-test-id="my-group-modal-close"
        onClick={() => {
          onClose();
        }}
      >
        <img
          className="text-producer-blue text-24"
          src={ReturnIcon}
          alt={lang.back}
        />
        {lang.back}
      </div>
      <div className="text-20 font-bold ml-10">
        <span className="text-gray-9c">{lang.myWallet}</span>
      </div>
      <div className="flex items-center justify-center font-medium ml-16">
        <span className="text-16 mr-4">总资产</span>
        <span className="text-24 mr-2 text-producer-blue">23462655.63</span>
        <span className="text-18 mr-3 text-producer-blue">USDT</span>
        <span className="text-16 hidden">≈63.21078784 BTC</span>
      </div>
      <div className="wallet-buttons flex items-center gap-x-[24px] flex-1 justify-end">
        <Button
          outline
          size="small"
          className="mr-2"
          onClick={() => {
            openDepositModal();
          }}
        >
          {lang.transferIn}
        </Button>
        <Button
          outline
          size="small"
          className="mr-2"
          onClick={() => {
            openWithdrawModal();
          }}
        >
          {lang.transferOut}
        </Button>
        <Button
          outline
          size="small"
          onClick={() => {
            openTransactionsModal();
          }}
        >
          {lang.transferRecord}
        </Button>
      </div>
      <style jsx>{`
        .wallet-buttons {
          margin-right: calc(50vw - 510px);
        }
      `}</style>
    </div>
  );
};
