import React from 'react';
import { createRoot } from 'react-dom/client';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { TextField, FormControl } from '@mui/material';
import { StoreProvider, useStore } from 'store';
import { ThemeRoot } from 'utils/theme';
import { lang } from 'utils/lang';
import Transactions from './transactions';
import MVMApi, { ICoin, INativeCoin, ITransaction } from 'apis/mvm';
import Loading from 'components/Loading';
import inputFinanceAmount from 'utils/inputFinanceAmount';
import sleep from 'utils/sleep';
import formatAmount from 'utils/formatAmount';
import openDepositModal from './openDepositModal';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { Contract, formatEther, parseEther } from 'ethers';
import * as ContractUtils from 'utils/contract';
import KeystoreApi from 'apis/keystore';
import getKeyName from 'utils/getKeyName';

interface IProps {
  rumSymbol: string
}

export default (props?: IProps) => {
  const div = document.createElement('div');
  document.body.append(div);
  const root = createRoot(div);
  const unmount = () => {
    root.unmount();
    div.remove();
  };
  root.render(
    <ThemeRoot>
      <StoreProvider>
        <Exchange
          rumSymbol={props ? props.rumSymbol : ''}
          rs={() => {
            setTimeout(unmount, 3000);
          }}
        />
      </StoreProvider>
    </ThemeRoot>,
  );
};

interface IDepositProps extends IProps {
  rs: () => void
}

const Exchange = observer((props: IDepositProps) => {
  const { snackbarStore, notificationSlideStore, confirmDialogStore, nodeStore } = useStore();
  const activeGroup = useActiveGroup();
  const state = useLocalObservable(() => ({
    fetched: false,
    exchanging: false,
    rumSymbol: '',
    amount: '',
    open: true,
    coins: [] as Array<ICoin | INativeCoin>,
    balanceMap: {} as Record<string, string>,
    transactions: [] as ITransaction[],
    get coin() {
      return this.coins.find((coin) => coin.rumSymbol === state.rumSymbol)!;
    },
    get sourceCoin() {
      return this.coins.find((coin) => coin.rumSymbol !== state.rumSymbol)!;
    },
    exchangeGasLimit: 300000n,
    gasPrice: 0n,
  }));

  React.useEffect(() => {
    (async () => {
      try {
        {
          const res = await MVMApi.coins();
          state.coins = Object.values(res.data).filter((coins) => coins.symbol === 'RUM');
          if (!state.fetched && props && res.data[props.rumSymbol]) {
            state.rumSymbol = props.rumSymbol;
          }
        }
        {
          const gasPrice = (await ContractUtils.provider.getFeeData()).gasPrice;
          state.gasPrice = gasPrice ?? 0n;
        }
        await fetchBalance();
        if (state.coin && state.sourceCoin) {
          state.fetched = true;
        }
        await fetchExchangeTransactions();
      } catch (err) {
        console.log(err);
      }
    })();
  }, []);

  const fetchBalance = React.useCallback(async () => {
    const balances = await Promise.all(state.coins.map(async (coin) => {
      if (coin.rumSymbol === 'RUM') {
        const balanceWEI = await ContractUtils.provider.getBalance(activeGroup.user_eth_addr);
        return formatEther(balanceWEI);
      }
      const contract = new Contract(coin.rumAddress, ContractUtils.RUM_ERC20_ABI, ContractUtils.provider);
      const balance = await contract.balanceOf(activeGroup.user_eth_addr);
      return formatEther(balance);
    }));
    for (const [index, coin] of state.coins.entries()) {
      state.balanceMap[coin.rumSymbol] = formatAmount(balances[index]);
    }
  }, []);

  const fetchExchangeTransactions = React.useCallback(async () => {
    const res = await MVMApi.transactions({
      address: activeGroup.user_eth_addr,
      count: 1000,
      sort: 'DESC',
    });
    state.transactions = res.data.filter((t) => t.type === 'EXCHANGE');
  }, []);

  const handleClose = action(() => {
    props.rs();
    state.open = false;
  });

  const handleSubmit = () => {
    if (!state.rumSymbol) {
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
      return;
    }
    if (!state.amount || parseFloat(state.amount) === 0) {
      snackbarStore.show({
        message: lang.require(lang.tokenAmount),
        type: 'error',
      });
      return;
    }
    if (state.rumSymbol === 'RUM') {
      if (+state.amount > +state.balanceMap[state.sourceCoin?.rumSymbol]) {
        confirmDialogStore.show({
          content: `您的余额不足 ${state.amount} ${state.sourceCoin?.rumSymbol || ''}`,
          okText: '去充值',
          ok: async () => {
            confirmDialogStore.hide();
            await sleep(300);
            openDepositModal({
              rumSymbol: state.sourceCoin?.rumSymbol,
            });
          },
        });
        return;
      }
      if (+formatEther(state.exchangeGasLimit * state.gasPrice) > +state.balanceMap.RUM) {
        confirmDialogStore.show({
          content: `您的 RUM 不足 ${formatEther(state.exchangeGasLimit * state.gasPrice)}`,
          okText: '去充值',
          ok: async () => {
            confirmDialogStore.hide();
            await sleep(300);
            openDepositModal({
              rumSymbol: 'RUM',
            });
          },
        });
        return;
      }
      confirmDialogStore.show({
        content: `确定兑换 ${state.amount} ${state.rumSymbol || ''} 吗？`,
        ok: async () => {
          state.exchanging = true;
          if (confirmDialogStore.loading) {
            return;
          }
          confirmDialogStore.setLoading(true);
          console.log('exchange');
          try {
            const contract = new Contract(state.sourceCoin.rumAddress, ContractUtils.RUM_ERC20_ABI, ContractUtils.provider);
            const data = contract.interface.encodeFunctionData('withdraw', [
              parseEther(state.amount),
            ]);
            const [keyName, nonce, network] = await Promise.all([
              getKeyName(nodeStore.storagePath, activeGroup.user_eth_addr),
              ContractUtils.provider.getTransactionCount(activeGroup.user_eth_addr, 'pending'),
              ContractUtils.provider.getNetwork(),
            ]);
            if (!keyName) {
              console.log('keyName not found');
              return;
            }
            const { data: signedTrx } = await KeystoreApi.signTx({
              keyname: keyName,
              nonce,
              to: state.sourceCoin.rumAddress,
              value: '0',
              gas_limit: Number(state.exchangeGasLimit),
              gas_price: `0x${state.gasPrice}`,
              data,
              chain_id: String(network.chainId),
            });
            console.log('signTx done');
            const txHash = await ContractUtils.provider.send('eth_sendRawTransaction', [signedTrx]);
            console.log('send done');
            confirmDialogStore.hide();
            notificationSlideStore.show({
              message: '正在兑换',
              type: 'pending',
              link: {
                text: '查看详情',
                url: ContractUtils.getExploreTxUrl(txHash),
              },
            });
            await ContractUtils.provider.waitForTransaction(txHash);
            const receipt = await ContractUtils.provider.getTransactionReceipt(txHash);
            console.log('receit done');
            if (receipt?.status === 0) {
              notificationSlideStore.show({
                message: '兑换失败',
                type: 'failed',
                link: {
                  text: '查看详情',
                  url: ContractUtils.getExploreTxUrl(txHash),
                },
              });
              state.exchanging = false;
            } else {
              notificationSlideStore.show({
                message: '兑换成功',
                duration: 5000,
                link: {
                  text: '查看详情',
                  url: ContractUtils.getExploreTxUrl(txHash),
                },
              });
              state.exchanging = false;
              await fetchBalance();
              await sleep(2000);
              await fetchExchangeTransactions();
            }
          } catch (e: any) {
            confirmDialogStore.setLoading(false);
            let message = e?.error?.reason || e?.error?.message || e?.message || lang.somethingWrong;
            if (e.body) {
              try {
                console.log(JSON.parse(e.body).error.message);
                message = JSON.parse(e.body).error.message;
              } catch {}
            }
            console.log(message);
            if (message.includes('insufficient funds for gas * price + value')) {
              message = lang.insufficientRum;
            }
            snackbarStore.show({
              message,
              type: 'error',
            });
            state.exchanging = false;
          }
        },
      });
    } else {
      if (
        state.sourceCoin.rumSymbol === 'RUM'
        && (+formatEther(parseEther(state.amount) + state.exchangeGasLimit * state.gasPrice) > +state.balanceMap.RUM)
      ) {
        confirmDialogStore.show({
          content: `您的余额不足 ${formatEther(parseEther(state.amount) + state.exchangeGasLimit * state.gasPrice)} ${state.sourceCoin.rumSymbol || ''}`,
          okText: '去充值',
          ok: async () => {
            confirmDialogStore.hide();
            await sleep(300);
            openDepositModal({
              rumSymbol: state.rumSymbol,
            });
          },
        });
        return;
      }
      confirmDialogStore.show({
        content: `确定兑换 ${state.amount} ${state.rumSymbol || ''} 吗？`,
        ok: async () => {
          state.exchanging = true;
          if (confirmDialogStore.loading) {
            return;
          }
          confirmDialogStore.setLoading(true);
          console.log('exchange');
          try {
            const contract = new Contract(state.coin.rumAddress, ContractUtils.RUM_ERC20_ABI, ContractUtils.provider);
            const data = contract.interface.encodeFunctionData('deposit', []);
            const [keyName, nonce, network] = await Promise.all([
              getKeyName(nodeStore.storagePath, activeGroup.user_eth_addr),
              ContractUtils.provider.getTransactionCount(activeGroup.user_eth_addr, 'pending'),
              ContractUtils.provider.getNetwork(),
            ]);
            if (!keyName) {
              console.log('keyName not found');
              return;
            }
            const { data: signedTrx } = await KeystoreApi.signTx({
              keyname: keyName,
              nonce,
              to: state.coin.rumAddress,
              value: `0x${parseEther(state.amount).toString(16)}`,
              gas_limit: Number(state.exchangeGasLimit),
              gas_price: `0x${state.gasPrice}`,
              data,
              chain_id: String(network.chainId),
            });
            console.log('signTx done');
            const txHash = await ContractUtils.provider.send('eth_sendRawTransaction', [signedTrx]);
            console.log('send done');
            confirmDialogStore.hide();
            notificationSlideStore.show({
              message: '正在兑换',
              type: 'pending',
              link: {
                text: '查看详情',
                url: ContractUtils.getExploreTxUrl(txHash),
              },
            });
            await ContractUtils.provider.waitForTransaction(txHash);
            const receipt = await ContractUtils.provider.getTransactionReceipt(txHash);
            console.log('receit done');
            if (receipt?.status === 0) {
              notificationSlideStore.show({
                message: '兑换失败',
                type: 'failed',
                link: {
                  text: '查看详情',
                  url: ContractUtils.getExploreTxUrl(txHash),
                },
              });
              state.exchanging = false;
            } else {
              notificationSlideStore.show({
                message: '兑换成功',
                duration: 5000,
                link: {
                  text: '查看详情',
                  url: ContractUtils.getExploreTxUrl(txHash),
                },
              });
              state.exchanging = false;
              await fetchBalance();
              await sleep(2000);
              await fetchExchangeTransactions();
            }
          } catch (e: any) {
            confirmDialogStore.setLoading(false);
            let message = e?.error?.reason || e?.error?.message || e?.message || lang.somethingWrong;
            if (e.body) {
              try {
                console.log(JSON.parse(e.body).error.message);
                message = JSON.parse(e.body).error.message;
              } catch {}
            }
            console.log(message);
            if (message.includes('insufficient funds for gas * price + value')) {
              message = lang.insufficientRum;
            }
            snackbarStore.show({
              message,
              type: 'error',
            });
            state.exchanging = false;
          }
        },
      });
    }
  };

  return (
    <Dialog
      maxWidth={false}
      open={state.open}
      onClose={handleClose}
      transitionDuration={300}
    >
      <div className="w-[780px] h-80-vh bg-white text-center py-8 px-12">
        {!state.fetched && (
          <div className="pt-40 flex justify-center">
            <Loading />
          </div>
        )}
        {state.fetched && (
          <div>
            <div className="text-20 font-bold text-gray-4a">{`用 ${state.rumSymbol === 'RUM' ? state.sourceCoin?.rumSymbol : 'RUM'} 兑换 ${state.rumSymbol}`}</div>
            <div className="w-60 mx-auto">
              <FormControl className="w-full mt-5">
                <TextField
                  placeholder="兑换数量"
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
              </FormControl>
            </div>
            {state.sourceCoin && (
              <div className="text-12 mx-auto w-[240px] flex justify-between text-gray-88"><div>持有 {state.rumSymbol} 数量:</div><div>{state.balanceMap[state.rumSymbol]}</div></div>
            )}
            {state.sourceCoin && (
              <div className="text-12 mx-auto w-[240px] flex justify-between text-gray-88"><div>持有 {state.sourceCoin.rumSymbol} 数量:</div><div>{state.balanceMap[state.sourceCoin.rumSymbol]}</div></div>
            )}
            <div className="mt-2 mx-auto w-[240px] flex justify-between text-gray-88"><div>Fee(RUM) total:</div><div>{formatEther(state.exchangeGasLimit * state.gasPrice)}</div></div>
            {state.sourceCoin.rumSymbol === 'RUM' && (
              <div className="text-12 text-red-400 text-left mx-auto w-[240px]">*请保留部分 RUM 作为钱包操作费用</div>
            )}
            <div className="mt-6">
              <Button
                className="rounded h-10"
                onClick={handleSubmit}
                disabled={state.exchanging}
              >
                {lang.yes}
              </Button>
            </div>
            <div className="py-10">
              <div className="text-16 py-3 text-left font-bold text-gray-6f">
                兑换记录
              </div>
              <Transactions data={state.transactions} myAddress={activeGroup.user_eth_addr} />
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
});
