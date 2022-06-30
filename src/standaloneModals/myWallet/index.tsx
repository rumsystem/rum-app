import React from 'react';
import { unmountComponentAtNode, render } from 'react-dom';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { Fade } from '@material-ui/core';
import { StoreProvider, useStore } from 'store';
import { ThemeRoot } from 'utils/theme';
import formatAmount from 'utils/formatAmount';
import Loading from 'components/Loading';
import MVMApi, { ICoin } from 'apis/mvm';
import Navbar from './navbar';
import Balance from './balance';
import fs from 'fs-extra';
import path from 'path';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { dialog } from '@electron/remote';

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
  const ADDRESS = '0x3a0075D4C979839E31D1AbccAcDF3FcAe981fe33';
  const state = useLocalObservable(() => ({
    open: true,
    fetched: false,
    coins: [] as ICoin[],
    balanceMap: {} as Record<string, string>,
  }));
  const { nodeStore, snackbarStore } = useStore();
  const activeGroup = useActiveGroup();

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

  const downloadKeyStore = async () => {
    try {
      const ret = await fs.readdir(path.join(nodeStore.storagePath, 'keystore'));
      const signFilenames = ret.filter((item) => item.startsWith('sign_') && item !== 'sign_default');
      let keystoreContent = '';
      for (const filename of signFilenames) {
        const content = await fs.readFile(path.join(nodeStore.storagePath, 'keystore', filename), 'utf8');
        if (content.includes(activeGroup.user_eth_addr.toLocaleLowerCase().replace('0x', ''))) {
          keystoreContent = content;
        }
      }
      if (!keystoreContent) {
        snackbarStore.show({
          message: '没有找到文件',
          type: 'error',
        });
        return;
      }
      const file = await dialog.showSaveDialog({
        defaultPath: `keystore_${activeGroup.user_eth_addr}.json`,
      });
      if (file.canceled || !file.filePath) {
        return;
      }
      await fs.writeFile(file.filePath.toString(), keystoreContent);
    } catch (e) {
      console.log(e);
    }
  };

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
          {state.fetched && (
            <div className="mt-12 text-center text-gray-400 opacity-80 text-12" onClick={downloadKeyStore}>
              <div>想要将钱包导入 MetaMask ？</div>
              <div className="cursor-pointer mt-2">
                点击下载钱包 JSON 文件
              </div>
            </div>
          )}
        </div>
      </div>
    </Fade>
  );
});
