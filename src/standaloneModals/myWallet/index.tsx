import React from 'react';
import { unmountComponentAtNode, render } from 'react-dom';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { Fade } from '@material-ui/core';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import formatAmount from 'utils/formatAmount';
import Loading from 'components/Loading';
import MVMApi, { ICoin } from 'apis/mvm';
import Navbar from './navbar';
import Balance from './balance';
import * as ethers from 'ethers';
import * as Contract from 'utils/contract';
import useActiveGroup from 'store/selectors/useActiveGroup';

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
        const privateKey = '0xdb34dc984e792f58f0ac74448a03d92a5e71939cadd32f75d3662229fa0aae3f';
        const wallet = new ethers.Wallet(privateKey);
        const coinsRes = await MVMApi.coins();
        const coins = Object.values(coinsRes.data);
        const balances = await Promise.all(coins.map(async (coin) => {
          const contract = new ethers.Contract(coin.rumAddress, Contract.RUM_ERC20_ABI, Contract.provider);
          const balance = await contract.balanceOf(wallet.address);
          return ethers.utils.formatEther(balance);
        }));
        for (const [index, coin] of coins.entries()) {
          state.balanceMap[coin.symbol] = formatAmount(balances[index]);
        }
        state.coins = coins.sort((a, b) => Number(state.balanceMap[b.symbol] || 0) * Number(b.price_usd) - Number(state.balanceMap[a.symbol] || 0) * Number(a.price_usd));
        state.fetched = true;
      } catch (err) {
        console.log(err);
      }
    };
    fetchBalance();
    const timer = setInterval(fetchBalance, 10000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  React.useEffect(() => {
    try {
      MVMApi.requestFee({
        account: activeGroup.user_eth_addr,
      });
    } catch (_) {}
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
