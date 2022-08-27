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
import MVMApi, { ICoin, ITransaction } from 'apis/mvm';
import Loading from 'components/Loading';
import inputFinanceAmount from 'utils/inputFinanceAmount';
import sleep from 'utils/sleep';
import formatAmount from 'utils/formatAmount';
import openMixinPayModal from './openMixinPayModal';
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

interface IDepositProps extends IProps {
  rs: () => void
}

const Deposit = observer((props: IDepositProps) => {
  const { snackbarStore, notificationSlideStore } = useStore();
  const activeGroup = useActiveGroup();
  const state = useLocalObservable(() => ({
    fetched: false,
    symbol: '',
    amount: '',
    open: true,
    coins: [] as ICoin[],
    balanceMap: {} as Record<string, string>,
    transactions: [] as ITransaction[],
    get coin() {
      return this.coins.find((coin) => coin.symbol === state.symbol)!;
    },
  }));

  React.useEffect(() => {
    (async () => {
      try {
        {
          const res = await MVMApi.coins();
          state.coins = Object.values(res.data);
          if (!state.fetched && props && res.data[props.symbol]) {
            state.symbol = props.symbol;
          }
        }
        state.fetched = true;
        await fetchBalance();
        await fetchDepositTransactions();
      } catch (err) {
        console.log(err);
      }
    })();
  }, []);

  const fetchBalance = React.useCallback(async () => {
    const balances = await Promise.all(state.coins.map(async (coin) => {
      const contract = new ethers.Contract(coin.rumAddress, Contract.RUM_ERC20_ABI, Contract.provider);
      const balance = await contract.balanceOf(activeGroup.user_eth_addr);
      return ethers.utils.formatEther(balance);
    }));
    for (const [index, coin] of state.coins.entries()) {
      state.balanceMap[coin.symbol] = formatAmount(balances[index]);
    }
  }, []);

  const fetchDepositTransactions = React.useCallback(async () => {
    const res = await MVMApi.transactions({
      account: activeGroup.user_eth_addr,
      count: 1000,
      sort: 'DESC',
    });
    state.transactions = res.data.filter((t) => t.type === 'DEPOSIT');
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
    if (!state.amount || parseFloat(state.amount) === 0) {
      snackbarStore.show({
        message: lang.require('数量'),
        type: 'error',
      });
      return;
    }
    let pending = true;
    Contract.provider.on('pending', (pendingTransaction) => {
      if (!pending) {
        return;
      }
      if (String(pendingTransaction.data).includes(activeGroup.user_eth_addr.slice(2).toLowerCase())) {
        const txHash = pendingTransaction.hash;
        notificationSlideStore.show({
          message: '正在充币',
          type: 'pending',
          link: {
            text: '查看详情',
            url: Contract.getExploreTxUrl(txHash),
          },
        });
        pending = false;
        Contract.provider.once(txHash, async () => {
          const receipt = await Contract.provider.getTransactionReceipt(txHash);
          if (receipt.status === 0) {
            notificationSlideStore.show({
              message: '充币失败',
              type: 'failed',
              link: {
                text: '查看详情',
                url: Contract.getExploreTxUrl(txHash),
              },
            });
          } else {
            notificationSlideStore.show({
              message: '充币成功',
              link: {
                text: '查看详情',
                url: Contract.getExploreTxUrl(pendingTransaction.hash),
              },
            });
            await fetchBalance();
            await sleep(2000);
            await fetchDepositTransactions();
          }
        });
      }
    });
    const isSuccess = await openMixinPayModal({
      url: MVMApi.deposit({
        asset: state.symbol,
        amount: state.amount,
        account: activeGroup.user_eth_addr,
      }),
    });
    if (isSuccess) {
      state.amount = '';
      notificationSlideStore.show({
        message: '正在充币',
        type: 'pending',
        link: {
          text: '',
          url: '',
        },
      });
    }
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
            <div className="text-20 font-bold text-gray-4a">充币</div>
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
                  placeholder="充币数量"
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
                    已持有数量: {state.balanceMap[state.symbol]}
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
            <div className="py-10">
              <div className="text-16 py-3 text-left font-bold text-gray-6f">
                充币记录
              </div>
              <Transactions data={state.transactions} />
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
});
