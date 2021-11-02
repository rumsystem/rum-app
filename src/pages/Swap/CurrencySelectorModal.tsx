import React from 'react';
import { observer } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { Finance } from 'utils';
import classNames from 'classnames';
import { useStore } from 'store';

interface IProps {
  currentCurrency: string;
  disabledCurrency: string;
  open: boolean;
  onClose: (currency?: string) => void;
}

const CurrencySelector = observer((props: IProps) => {
  const { poolStore } = useStore();
  const { currentCurrency, disabledCurrency } = props;
  return (
    <div className="bg-white rounded-12 text-center py-5 w-70">
      <div className="text-18 font-bold">选择币种</div>
      <div className="mt-3">
        {[currentCurrency, ...poolStore.currencyPairMap[currentCurrency]]
          .filter((currency: string) => currency !== disabledCurrency)
          .map((currency: string) => (
            <div
              className={classNames(
                {
                  'hover:bg-gray-f7 cursor-pointer text-gray-4a':
                    currency !== disabledCurrency,
                  'text-gray-bf cursor-not-allowed':
                    currency === disabledCurrency,
                },
                'flex items-center py-3 px-8 text-16 font-bold'
              )}
              key={currency}
              onClick={() =>
                currency !== disabledCurrency && props.onClose(currency)
              }
            >
              <img
                src={Finance.currencyIconMap[currency]}
                alt={currency}
                className="w-8 h-8 mr-4"
              />
              {currency}
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
      <CurrencySelector {...props} />
    </Dialog>
  );
});
