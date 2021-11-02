import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import { Finance } from 'utils';
import { MdSwapHoriz } from 'react-icons/md';
import Button from 'components/Button';
import { useHistory } from 'react-router-dom';

export default observer(() => {
  const { poolStore } = useStore();
  const history = useHistory();

  return (
    <div className="w-500-px mx-auto">
      <div className="p-6 px-8 rounded-12 bg-white">
        {poolStore.pools.map((pool) => {
          const token1 = pool.tokens[0];
          const token2 = pool.tokens[1];
          return (
            <div
              className="text-gray-70 leading-none relative"
              key={pool.invariant}
            >
              <div className="text-16 text-indigo-400 font-bold flex items-center">
                <img
                  src={Finance.currencyIconMap[token1.symbol]}
                  alt="icon"
                  className="rounded-full w-8 h-8 border-4 border-white relative z-10 box-content"
                />
                <img
                  src={Finance.currencyIconMap[token2.symbol]}
                  alt="icon"
                  className="-ml-2 rounded-full w-8 h-8 relative z-0 mr-3"
                />
                <div className="flex items-center">
                  {token1.symbol}
                  <MdSwapHoriz className="mx-1 text-indigo-400 text-20" />
                  {token2.symbol}
                </div>
              </div>
              <div className="flex">
                <div className="mt-3 flex items-center border border-gray-ec rounded-full p-6-px">
                  <img
                    src={Finance.currencyIconMap[token1.symbol]}
                    alt="icon"
                    className="rounded-full w-8 h-8"
                  />
                  <div className="text-15 ml-3 font-bold pr-4">
                    {token1.volume} {token1.symbol}
                  </div>
                </div>
              </div>
              <div className="flex">
                <div className="mt-3 flex items-center border border-gray-ec rounded-full p-6-px">
                  <img
                    src={Finance.currencyIconMap[token2.symbol]}
                    alt="icon"
                    className="rounded-full w-8 h-8"
                  />
                  <div className="text-15 ml-3 font-bold pr-4">
                    {token2.volume} {token2.symbol}
                  </div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-22 mt-10">
                <Button
                  onClick={() => {
                    history.replace(
                      `/swap?tab=lp&type=in&currency_pair=${token1.symbol}-${token2.symbol}`
                    );
                  }}
                >
                  存入
                </Button>
                <Button
                  className="mt-4"
                  color="red"
                  onClick={() => {
                    history.replace(
                      `/swap?tab=lp&type=out&currency_pair=${token1.symbol}-${token2.symbol}`
                    );
                  }}
                >
                  取回
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
