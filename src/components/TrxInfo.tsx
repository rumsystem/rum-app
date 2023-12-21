import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { ImInfo } from 'react-icons/im';
import TrxModal from 'components/TrxModal';

export default observer((props: { trxId: string }) => {
  const state = useLocalObservable(() => ({
    showTrxModal: false,
  }));

  const openTrxModal = () => {
    state.showTrxModal = true;
  };

  const closeTrxModal = () => {
    state.showTrxModal = false;
  };

  return (
    <div className="relative w-[18px] h-[14px]">
      <div
        className="absolute top-[-1px] left-0 text-gray-af px-[2px] cursor-pointer"
        onClick={openTrxModal}
      >
        <ImInfo className="text-15" />
      </div>
      <TrxModal
        trxId={props.trxId}
        open={state.showTrxModal}
        onClose={closeTrxModal}
      />
    </div>
  );
});
