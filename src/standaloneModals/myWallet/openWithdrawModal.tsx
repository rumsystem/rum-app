import React from 'react';
import { unmountComponentAtNode, render } from 'react-dom';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { TextField, FormControl, Select, MenuItem, InputLabel, FormHelperText, Tooltip } from '@material-ui/core';
import { StoreProvider, useStore } from 'store';
import { ThemeRoot } from 'utils/theme';
import { lang } from 'utils/lang';
import Transactions from './transactions';
import MVMApi, { ICoin, IBound, ITransaction } from 'apis/mvm';
import Loading from 'components/Loading';
import { shell } from '@electron/remote';
import inputFinanceAmount from 'utils/inputFinanceAmount';
import sleep from 'utils/sleep';
import getMixinUID from 'standaloneModals/getMixinUID';
import formatAmount from 'utils/formatAmount';

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
  const ADDRESS = '0x3a0075D4C979839E31D1AbccAcDF3FcAe981fe33';
  const state = useLocalObservable(() => ({
    fetched: false,
    asset: '',
    amount: '',
    open: true,
    coins: [] as ICoin[],
    balanceMap: {} as Record<string, string>,
    bound: null as IBound | null,
    transactions: [] as ITransaction[],
  }));

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        {
          const res = await MVMApi.coins();
          state.coins = Object.values(res.data);
          if (!state.fetched && props && res.data[props.asset]) {
            state.asset = props.asset;
          }
        }
        {
          const res = await MVMApi.account(ADDRESS);
          const assets = Object.values(res.data.assets);
          for (const asset of assets) {
            state.balanceMap[asset.symbol] = formatAmount(asset.amount);
          }
        }
        {
          const res = await MVMApi.bounds(ADDRESS);
          const bound = res.data.shift();
          if (bound) {
            state.bound = bound;
          }
        }
        {
          const res = await MVMApi.transactions({
            account: ADDRESS,
            count: 1000,
            sort: 'DESC',
          });
          state.transactions = res.data.filter((t) => t.type === 'WITHDRAW');
        }
        state.fetched = true;
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
    const timer = setInterval(fetchData, 5000);

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
    if (Number(state.amount) > Number(state.balanceMap[state.asset])) {
      snackbarStore.show({
        message: `最多提取 ${state.balanceMap[state.asset]} ${state.asset}`,
        type: 'error',
      });
      return;
    }
    if (!state.bound) {
      confirmDialogStore.show({
        content: '请先绑定你要用来接收币种的 Mixin 帐号',
        cancelText: '取消',
        okText: '去绑定',
        ok: async () => {
          await bindMixin();
          await sleep(2000);
          confirmDialogStore.show({
            content: '正在绑定 Mixin 帐号...',
            cancelText: '已取消',
            okText: '已完成',
            ok: () => {
              confirmDialogStore.hide();
            },
          });
        },
      });
      return;
    }
    shell.openExternal(MVMApi.withdraw({
      asset: state.asset,
      amount: state.amount,
    }));
    await sleep(2000);
    confirmDialogStore.show({
      content: '正在提币...',
      cancelText: '已取消',
      okText: '已完成',
      ok: async () => {
        confirmDialogStore.setLoading(true);
        await sleep(5000);
        snackbarStore.show({
          message: '请前往 Mixin 查看',
          duration: 2000,
        });
        state.amount = '';
        confirmDialogStore.hide();
      },
    });
  };

  const bindMixin = async () => {
    const mixinUUID = await getMixinUID();
    console.log({ mixinUUID });
    shell.openExternal(MVMApi.bind(mixinUUID));
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
                  onChange={action((e) => {
                    state.asset = e.target.value as string;
                    state.amount = '';
                  })}
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
                  placeholder="提币数量"
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
              <div className="mt-6">
                <Button
                  className="rounded w-full"
                  onClick={handleSubmit}
                >
                  {lang.yes}
                </Button>
              </div>
              {state.bound && (
                <div className="flex justify-center items-center mt-2 text-gray-400 text-12 opacity-80">
                  接收币种的 Mixin 帐号:
                  <Tooltip
                    placement="bottom"
                    title="点击可以重新绑定"
                    arrow
                  >
                    <span className="font-bold ml-1 cursor-pointer" onClick={bindMixin}>{state.bound.profile.full_name}</span>
                  </Tooltip>
                  ({state.bound.profile.identity_number})
                </div>
              )}
            </div>
            <div className="py-10">
              <div className="text-16 py-3 text-left font-bold text-gray-6f">
                提币记录
              </div>
              <Transactions data={state.transactions} />
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
});