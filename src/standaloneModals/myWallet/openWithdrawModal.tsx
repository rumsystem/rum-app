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
import inputFinanceAmount from 'utils/inputFinanceAmount';
import getMixinUID from 'standaloneModals/getMixinUID';
import formatAmount from 'utils/formatAmount';
import useActiveGroup from 'store/selectors/useActiveGroup';
import * as ethers from 'ethers';
import * as Contract from 'utils/contract';

interface IProps {
  symbol: string
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
            symbol={props ? props.symbol : ''}
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
  const state = useLocalObservable(() => ({
    fetched: false,
    symbol: '',
    amount: '',
    open: true,
    coins: [] as ICoin[],
    balanceMap: {} as Record<string, string>,
    bound: null as IBound | null,
    transactions: [] as ITransaction[],
    binding: false,
    pending: false,
    get coin() {
      return this.coins.find((coin) => coin.symbol === state.symbol)!;
    },
  }));

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        {
          const res = await MVMApi.coins();
          state.coins = Object.values(res.data);
          if (!state.fetched && props && res.data[props.symbol]) {
            state.symbol = props.symbol;
          }
        }
        {
          const address = '0x2F2364934272DF9191e4e48514C5B3caBd0Cab2a';
          const balances = await Promise.all(state.coins.map(async (coin) => {
            const contract = new ethers.Contract(coin.rumAddress, Contract.RUM_ERC20_ABI, Contract.provider);
            const balance = await contract.balanceOf(address);
            return ethers.utils.formatEther(balance);
          }));
          for (const [index, coin] of state.coins.entries()) {
            state.balanceMap[coin.symbol] = formatAmount(balances[index]);
          }
        }
        {
          const res = await MVMApi.bounds(activeGroup.user_eth_addr);
          const contract = new ethers.Contract(Contract.RUM_ACCOUNT_CONTRACT_ADDRESS, Contract.RUM_ACCOUNT_ABI, Contract.provider);
          const account = await contract.accounts(activeGroup.user_eth_addr);
          console.log({ account });
          const bound = res.data.shift();
          if (bound) {
            state.bound = bound;
          }
        }
        {
          const res = await MVMApi.transactions({
            account: activeGroup.user_eth_addr,
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
    if (!state.symbol) {
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
    if (Number(state.amount) > Number(state.balanceMap[state.symbol])) {
      snackbarStore.show({
        message: `最多提取 ${state.balanceMap[state.symbol]} ${state.symbol}`,
        type: 'error',
      });
      return;
    }
    if (!state.bound) {
      confirmDialogStore.show({
        content: '请先绑定你要用来接收币种的 Mixin 帐号',
        cancelText: '取消',
        okText: '去绑定',
        ok: () => {
          bindMixin();
        },
      });
      return;
    }
    const privateKey = '0xdb34dc984e792f58f0ac74448a03d92a5e71939cadd32f75d3662229fa0aae3f';
    const contract = new ethers.Contract(state.coin.rumAddress, Contract.RUM_ERC20_ABI, Contract.provider);
    const wallet = new ethers.Wallet(privateKey, Contract.provider);
    const contractWithWallet = contract.connect(wallet);
    state.pending = true;
    await contractWithWallet.transfer(Contract.WITHDRAW_TO, ethers.utils.parseEther(state.amount));
    contractWithWallet.on('Transfer', (from) => {
      if (!state.pending) {
        return;
      }
      if (from === wallet.address) {
        state.pending = false;
        state.amount = '';
        snackbarStore.show({
          message: '提币成功，请前往 Mixin 查看',
          duration: 2000,
        });
      }
    });
  };

  const bindMixin = async () => {
    const mixinUUID = await getMixinUID();
    state.binding = true;
    const privateKey = '0xdb34dc984e792f58f0ac74448a03d92a5e71939cadd32f75d3662229fa0aae3f';
    const contract = new ethers.Contract(Contract.RUM_ACCOUNT_CONTRACT_ADDRESS, Contract.RUM_ACCOUNT_ABI, Contract.provider);
    const wallet = new ethers.Wallet(privateKey, Contract.provider);
    const contractWithWallet = contract.connect(wallet);
    await contractWithWallet.selfBind('MIXIN', mixinUUID, '{"request":{"type":"MIXIN"}}', '');
    contractWithWallet.on('Bind', (address, _0, uuid, _1) => {
      if (address === wallet.address && uuid === mixinUUID) {
        state.binding = false;
      }
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
                  value={state.symbol}
                  label="选择币种"
                  onChange={action((e) => {
                    state.symbol = e.target.value as string;
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
                {state.symbol && (
                  <FormHelperText className="opacity-60 text-12">
                    可提币数量: {state.balanceMap[state.symbol]}
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
              {state.bound && !state.binding && (
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
              {state.binding && (
                <div className="flex justify-center items-center mt-2 text-gray-400 text-12 opacity-80">
                  正在绑定 Mixin 帐号，请稍等 <div className="ml-2" /><Loading size={10} />
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
