import React from 'react';
import classNames from 'classnames';
import { unmountComponentAtNode, render } from 'react-dom';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { Fade, Switch } from '@material-ui/core';

import { StoreProvider } from 'store';

import { ThemeRoot } from 'utils/theme';
import { lang } from 'utils/lang';

import BackToTop from 'components/BackToTop';
import Help from 'layouts/Main/Help';

import SearchGroupIcon from 'assets/search_group.svg';

import Navbar from './navbar';
import Searcher from './searcher';
import Table from './table';

export const myWallet = async () => new Promise<void>((rs) => {
  const div = document.createElement('div');
  document.body.append(div);
  const unmount = () => {
    unmountComponentAtNode(div);
    div.remove();
  };
  render(
    (
      <ThemeRoot>
        <StoreProvider>
          <MyWallet
            rs={() => {
              rs();
              setTimeout(unmount, 3000);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
});

interface Props {
  rs: () => unknown
}

const MyWallet = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    open: false,
    coins: [] as any[],
    filterCoins: [] as any[],
    keyword: '',
    hideUnfamousCoin: false,
  }));

  const scrollBox = React.useRef<HTMLDivElement>(null);

  const handleClose = action(() => {
    props.rs();
    state.open = false;
  });

  React.useEffect(action(() => {
    state.filterCoins = state.coins.filter((coin) => coin.name.includes(state.keyword) && (!state.hideUnfamousCoin || coin.famous));
  }), [state, state.coins, state.keyword, state.hideUnfamousCoin]);

  React.useEffect(action(() => {
    state.open = true;
    state.coins = [
      { id: 1, token: 'BTC', name: 'Bitcoin', count: '149.12475', usdt_price: '149.12475', btc_price: '1', famous: true },
      { id: 2, token: 'ETH', name: 'Ethereum', count: '149.12475', usdt_price: '149.12475', btc_price: '1', famous: true },
      { id: 3, token: 'RUM', name: 'Quorum', count: '149.12475', usdt_price: '149.12475', btc_price: '1', famous: false },
    ];
  }), []);

  return (
    <Fade
      in={state.open}
      timeout={500}
      mountOnEnter
      unmountOnExit
    >
      <div
        className="flex flex-col items-stretch fixed inset-0 top-[40px] bg-gray-f7 z-50"
        data-test-id="my-wallet-modal"
      >
        <Navbar onClose={handleClose} />

        <div
          className="flex flex-col items-center overflow-auto flex-1"
          ref={scrollBox}
        >
          <div className="w-[960px] mt-[22px] mb-[11px] flex items-center gap-x-[30px]">
            <div className="flex items-center">
              <div className="text-gray-af text-17">{lang.hideUnfamousCoin}</div>
              <Switch checked={state.hideUnfamousCoin} onChange={() => { state.hideUnfamousCoin = !state.hideUnfamousCoin; }} color='primary' />
            </div>
            <Searcher
              width="280px"
              keyword={state.keyword}
              onChange={(value: string) => {
                state.keyword = value;
              }}
              placeholder={lang.searchCoin}
            />
          </div>

          <div
            className="w-[960px]"
          >
            <Table
              heads={['币种', '可用', '操作']}
              rows={state.filterCoins}
            />
            {
              state.keyword && state.filterCoins.length === 0 && (
                <div className="h-full bg-gray-f7 flex items-center justify-center">
                  <div className="flex flex-col items-center mb-[140px]">
                    <img className="w-[88px] h-[80px] mb-[19px]" src={SearchGroupIcon} />
                    <div className="text-16 text-gray-4a font-medium">暂无搜索结果</div>
                    <div className="text-14 text-gray-af font-medium">换个关键词试试吧~</div>
                  </div>
                </div>
              )
            }
          </div>
        </div>
        <div
          className={classNames(
            'fixed bottom-6 right-[50%] hidden 2lg:block mr-[-548px]',
          )}
        >
          <BackToTop rootRef={scrollBox} />
          <div className="mb-3" />
          <Help />
        </div>
      </div>
    </Fade>
  );
});
