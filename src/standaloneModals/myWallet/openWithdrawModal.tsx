import React from 'react';
import { unmountComponentAtNode, render } from 'react-dom';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { TextField, FormControl, Select, MenuItem, InputLabel, FormHelperText } from '@material-ui/core';
import { StoreProvider, useStore } from 'store';
import { ThemeRoot } from 'utils/theme';
import { lang } from 'utils/lang';
import Transactions from './transactions';
import WalletApi, { ICoin } from 'apis/wallet';
import Loading from 'components/Loading';
import { shell } from '@electron/remote';
import useActiveGroup from 'store/selectors/useActiveGroup';
import inputFinanceAmount from 'utils/inputFinanceAmount';
import sleep from 'utils/sleep';

interface IProps {
  asset: string
}

export default (props?: IProps) => {
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
          <Deposit
            asset={props ? props.asset : ''}
            rs={() => {
              setTimeout(unmount, 3000);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
};

interface IWithdrawProps extends IProps {
  rs: () => void
}

const Deposit = observer((props: IWithdrawProps) => {
  const { snackbarStore, confirmDialogStore } = useStore();
  const activeGroup = useActiveGroup();
  activeGroup.user_eth_addr = '0x3a0075D4C979839E31D1AbccAcDF3FcAe981fe33';
  const state = useLocalObservable(() => ({
    fetched: false,
    asset: '',
    amount: '',
    open: true,
    coins: [] as ICoin[],
    balanceMap: {} as Record<string, string>,
  }));

  React.useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await WalletApi.coins();
        state.coins = Object.values(res.data);
        const balanceRes = await WalletApi.account(activeGroup.user_eth_addr);
        const assets = Object.values(balanceRes.data.assets);
        for (const asset of assets) {
          state.balanceMap[asset.symbol] = asset.amount;
        }
        if (!state.fetched && props && res.data[props.asset]) {
          state.asset = props.asset;
        }
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

  const handleClose = action(() => {
    props.rs();
    state.open = false;
  });

  const handleSubmit = async () => {
    if (!state.asset) {
      snackbarStore.show({
        message: lang.require('币种'),
        type: 'error',
      });
      return;
    }
    if (!state.amount) {
      snackbarStore.show({
        message: lang.require('数量'),
        type: 'error',
      });
      return;
    }
    if (parseInt(state.amount, 10) > parseInt(state.balanceMap[state.asset], 10)) {
      snackbarStore.show({
        message: `最多提取 ${state.balanceMap[state.asset]} ${state.asset}`,
        type: 'error',
      });
      return;
    }
    // shell.openExternal(WalletApi.bind('c39c2ecc-2109-499f-b6c4-d6f278ea29fb'));
    // await sleep(200);
    shell.openExternal(WalletApi.withdraw({
      asset: state.asset,
      amount: state.amount,
    }));
    await sleep(2000);
    confirmDialogStore.show({
      content: '正在提币...',
      cancelText: '已取消',
      okText: '已完成',
      ok: () => {
        snackbarStore.show({
          message: '已提币，请前往 Mixin 查看',
        });
        state.asset = '';
        state.amount = '';
        confirmDialogStore.hide();
      },
    });
  };

  return (
    <Dialog
      maxWidth={false}
      open={state.open}
      onClose={handleClose}
      transitionDuration={{
        enter: 300,
      }}
    >
      <div className="w-[780px] h-80-vh bg-white text-center py-8 px-12">
        {!state.fetched && (
          <div className="pt-40 flex justify-center">
            <Loading />
          </div>
        )}
        {state.fetched && (
          <div>
            <div className="text-20 font-bold text-gray-4a">提币</div>
            <div className="pt-8 w-60 mx-auto">
              <FormControl
                className="w-full text-left"
                size="small"
                variant="outlined"
              >
                <InputLabel>选择币种</InputLabel>
                <Select
                  value={state.asset}
                  label="选择币种"
                  onChange={action((e) => { state.asset = e.target.value as string; })}
                >
                  {state.coins.map((coin) => (
                    <MenuItem key={coin.id} value={coin.symbol} className="flex items-center leading-none">{coin.symbol}
                      <span className="ml-1 opacity-40 text-12">- {coin.name}</span>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl className="w-full mt-5">
                <TextField
                  placeholder="数量"
                  size="small"
                  value={state.amount}
                  onChange={(e) => {
                    const amount = inputFinanceAmount(e.target.value);
                    if (amount !== null) {
                      state.amount = amount;
                    }
                  }}
                  margin="dense"
                  variant="outlined"
                />
                {state.asset && (
                  <FormHelperText className="opacity-60 text-12">
                    可提币数量: {state.balanceMap[state.asset]}
                  </FormHelperText>
                )}
              </FormControl>
            </div>
            <div className="mt-6">
              <Button
                className="rounded h-10"
                onClick={handleSubmit}
              >
                {lang.yes}
              </Button>
            </div>
            <div className="mt-10">
              <div className="text-16 py-3 text-left font-bold">
                提币记录
              </div>
              <Transactions />
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
});
