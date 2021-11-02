import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import { Finance } from 'utils';
import { MdSwapHoriz } from 'react-icons/md';
import Button from 'components/Button';
import { useHistory } from 'react-router-dom';
import Tooltip from '@material-ui/core/Tooltip';

export default observer(() => {
  const { poolStore } = useStore();
  const history = useHistory();

  return (
    <div className="w-500-px mx-auto">
      {poolStore.pools.map((pool) => {
        const token1 = pool.tokens[0];
        const token2 = pool.tokens[1];
        return (
          <div
            className="p-6 px-8 rounded-12 bg-white mb-6"
            key={pool.invariant}
          >
            <div className="text-gray-70 leading-none relative">
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
                <Tooltip
                  placement="top"
                  title="为资金池注入流动性，需要你按照当前兑换率提供两种币，你将得到凭证；可随时按彼时兑换率赎回两种币，根据你提供的流动性占比获得手续费分成。流动性提供者的实际收益，是价格差异引起的背离损失与交易累积手续费之间的平衡。如你尚未理解收益及风险，请勿大额注入"
                  arrow
                >
                  <div>
                    <Button
                      onClick={() => {
                        history.replace(
                          `/swap?tab=lp&type=in&token=${token1.symbol}${token2.symbol}`
                        );
                      }}
                    >
                      注入
                    </Button>
                  </div>
                </Tooltip>
                <Button
                  className="mt-4"
                  color="red"
                  onClick={() => {
                    history.replace(
                      `/swap?tab=lp&type=out&token=${token1.symbol}${token2.symbol}`
                    );
                  }}
                >
                  赎回
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
