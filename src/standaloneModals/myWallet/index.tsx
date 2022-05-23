import React from 'react';
import { unmountComponentAtNode, render } from 'react-dom';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { Fade } from '@material-ui/core';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import useActiveGroup from 'store/selectors/useActiveGroup';
import formatAmount from 'utils/formatAmount';
import Loading from 'components/Loading';
import MVMApi, { ICoin } from 'apis/mvm';
import Navbar from './navbar';
import Balance from './balance';

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
  const activeGroup = useActiveGroup();
  console.log({ activeGroup });
  const ADDRESS = '0x3a0075D4C979839E31D1AbccAcDF3FcAe981fe33';
  const state = useLocalObservable(() => ({
    open: true,
    fetched: false,
    coins: [] as ICoin[],
    balanceMap: {} as Record<string, string>,
  }));

  const handleClose = action(() => {
    props.rs();
    state.open = false;
  });

  React.useEffect(() => {
    const fetchBalance = async () => {
      try {
        const coinsRes = await MVMApi.coins();
        const coins = Object.values(coinsRes.data);
        const balanceRes = await MVMApi.account(ADDRESS);
        const assets = Object.values(balanceRes.data.assets);
        for (const asset of assets) {
          state.balanceMap[asset.symbol] = formatAmount(asset.amount);
        }
        state.coins = coins.sort((a, b) => Number(state.balanceMap[b.symbol] || 0) * Number(b.price_usd) - Number(state.balanceMap[a.symbol] || 0) * Number(a.price_usd));
        state.fetched = true;
      } catch (err) {
        console.log(err);
      }
    };
    fetchBalance();
    const timer = setInterval(fetchBalance, 5000);

    return () => {
      clearInterval(timer);
    };
  }, []);

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
        <Navbar coins={state.coins} balanceMap={state.balanceMap} onClose={handleClose} />

        <div className="w-[960px] mx-auto mt-10">
          {!state.fetched && (
            <div className="pt-40 flex justify-center">
              <Loading />
            </div>
          )}
          {state.fetched && (
            <Balance coins={state.coins} balanceMap={state.balanceMap} />
          )}
        </div>
      </div>
    </Fade>
  );
});
