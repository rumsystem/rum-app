import React from 'react';
import { observer } from 'mobx-react-lite';
import { Dialog } from '@material-ui/core';
import { Finance } from 'utils';
import { useStore } from 'store';

interface IProps {
  open: boolean;
  onClose: (currency?: string) => void;
}

const CurrencyPairSelector = observer((props: IProps) => {
  const { poolStore } = useStore();
  return (
    <div className="bg-white rounded-12 text-center py-5 w-70">
      <div className="text-18 font-bold">选择交易对</div>
      <div className="mt-3">
        {poolStore.currencyPairs.map((currencyPair: string) => (
          <div
            className="flex items-center py-3 px-8 text-16 font-bold hover:bg-gray-f7 cursor-pointer text-gray-4a"
            key={currencyPair}
            onClick={() => props.onClose(currencyPair)}
          >
            <img
              src={Finance.defaultCurrencyIcon}
              alt={currencyPair}
              className="w-8 h-8 mr-4"
            />
            {currencyPair}
          </div>
        ))}
      </div>
    </div>
  );
});

export default observer((props: IProps) => {
  return (
    <Dialog
      open={props.open}
      onClose={() => props.onClose()}
      transitionDuration={{
        enter: 300,
      }}
    >
      <CurrencyPairSelector {...props} />
    </Dialog>
  );
});
