import React from 'react';

import { lang } from 'utils/lang';
import ReturnIcon from 'assets/iconReturn.svg';

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
        className="flex-shrink-0 self-stretch ml-10 flex gap-x-3 justify-center items-center text-16 cursor-pointer"
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
      <div className="flex-shrink-0 text-20 font-bold ml-10">
        <span className="text-gray-9c">{lang.myWallet}</span>
        <span className="mr-3">:</span>
        <span>歪理学说</span>
      </div>
      <div className="flex-shrink-0 flex-grow flex items-center justify-center font-medium">
        <span className="text-16 mr-4">总资产</span>
        <span className="text-24 mr-2 text-producer-blue">23462655.63</span>
        <span className="text-18 mr-3 text-producer-blue">USDT</span>
        <span className="text-16">≈63.21078784 BTC</span>
      </div>
      <div className="flex-shrink-0 wallet-buttons flex items-center gap-x-[24px]">
        <div
          className="h-7 border border-gray-af rounded flex px-4  items-center justify-center cursor-pointer text-14 text-gray-6f"
        >
          {lang.transferIn}
        </div>
        <div
          className="h-7 border border-gray-af rounded flex px-4  items-center justify-center cursor-pointer text-14 text-gray-6f"
        >
          {lang.transferOut}
        </div>
        <div
          className="h-7 border border-gray-af rounded flex px-4 items-center justify-center cursor-pointer text-14 text-gray-6f"
        >
          {lang.transferRecord}
        </div>
      </div>
      <style jsx>{`
        .wallet-buttons {
          margin-right: calc(50vw - 510px);
        }
      `}</style>
    </div>
  );
};
