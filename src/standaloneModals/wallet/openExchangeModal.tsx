import React from 'react';
import { unmountComponentAtNode, render } from 'react-dom';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { TextField, FormControl } from '@material-ui/core';
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
import * as ethers from 'ethers';
import * as Contract from 'utils/contract';
import KeystoreApi from 'apis/keystore';
import getKeyName from 'utils/getKeyName';

interface IProps {
  rumSymbol: string
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
          <Exchange
            rumSymbol={props ? props.rumSymbol : ''}
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
    exchangeGasLimit: ethers.BigNumber.from(300000),
    gasPrice: ethers.BigNumber.from(0),
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
          const gasPrice = await Contract.provider.getGasPrice();
          state.gasPrice = gasPrice;
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
        const balanceWEI = await Contract.provider.getBalance(activeGroup.user_eth_addr);
        return ethers.utils.formatEther(balanceWEI);
      }
      const contract = new ethers.Contract(coin.rumAddress, Contract.RUM_ERC20_ABI, Contract.provider);
      const balance = await contract.balanceOf(activeGroup.user_eth_addr);
      return ethers.utils.formatEther(balance);
    }));
    for (const [index, coin] of state.coins.entries()) {
      state.balanceMap[coin.rumSymbol] = formatAmount(balances[index]);
    }
  }, []);

  const fetchExchangeTransactions = React.useCallback(async () => {
    const res = await MVMApi.transactions({
      account: activeGroup.user_eth_addr,
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
      if (+ethers.utils.formatEther(state.exchangeGasLimit.mul(state.gasPrice)) > +state.balanceMap.RUM) {
        confirmDialogStore.show({
          content: `您的 RUM 不足 ${ethers.utils.formatEther(state.exchangeGasLimit.mul(state.gasPrice))}`,
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
            const contract = new ethers.Contract(state.sourceCoin.rumAddress, Contract.RUM_ERC20_ABI, Contract.provider);
            const data = contract.interface.encodeFunctionData('withdraw', [
              ethers.utils.parseEther(state.amount),
            ]);
            const [keyName, nonce, network] = await Promise.all([
              getKeyName(nodeStore.storagePath, activeGroup.user_eth_addr),
              Contract.provider.getTransactionCount(activeGroup.user_eth_addr, 'pending'),
              Contract.provider.getNetwork(),
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
              gas_limit: state.exchangeGasLimit.toNumber(),
              gas_price: state.gasPrice.toHexString(),
              data,
              chain_id: String(network.chainId),
            });
            console.log('signTx done');
            const txHash = await Contract.provider.send('eth_sendRawTransaction', [signedTrx]);
            console.log('send done');
            confirmDialogStore.hide();
            notificationSlideStore.show({
              message: '正在兑换',
              type: 'pending',
              link: {
                text: '查看详情',
                url: Contract.getExploreTxUrl(txHash),
              },
            });
            await Contract.provider.waitForTransaction(txHash);
            const receipt = await Contract.provider.getTransactionReceipt(txHash);
            console.log('receit done');
            if (receipt.status === 0) {
              notificationSlideStore.show({
                message: '兑换失败',
                type: 'failed',
                link: {
                  text: '查看详情',
                  url: Contract.getExploreTxUrl(txHash),
                },
              });
              state.exchanging = false;
            } else {
              notificationSlideStore.show({
                message: '兑换成功',
                duration: 5000,
                link: {
                  text: '查看详情',
                  url: Contract.getExploreTxUrl(txHash),
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
        && (+ethers.utils.formatEther(ethers.utils.parseEther(state.amount).add(state.exchangeGasLimit.mul(state.gasPrice))) > +state.balanceMap.RUM)
      ) {
        confirmDialogStore.show({
          content: `您的余额不足 ${ethers.utils.formatEther(ethers.utils.parseEther(state.amount).add(state.exchangeGasLimit.mul(state.gasPrice)))} ${state.sourceCoin.rumSymbol || ''}`,
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
            const contract = new ethers.Contract(state.coin.rumAddress, Contract.RUM_ERC20_ABI, Contract.provider);
            const data = contract.interface.encodeFunctionData('deposit', []);
            const [keyName, nonce, network] = await Promise.all([
              getKeyName(nodeStore.storagePath, activeGroup.user_eth_addr),
              Contract.provider.getTransactionCount(activeGroup.user_eth_addr, 'pending'),
              Contract.provider.getNetwork(),
            ]);
            if (!keyName) {
              console.log('keyName not found');
              return;
            }
            const { data: signedTrx } = await KeystoreApi.signTx({
              keyname: keyName,
              nonce,
              to: state.coin.rumAddress,
              value: ethers.utils.parseEther(state.amount).toHexString(),
              gas_limit: state.exchangeGasLimit.toNumber(),
              gas_price: state.gasPrice.toHexString(),
              data,
              chain_id: String(network.chainId),
            });
            console.log('signTx done');
            const txHash = await Contract.provider.send('eth_sendRawTransaction', [signedTrx]);
            console.log('send done');
            confirmDialogStore.hide();
            notificationSlideStore.show({
              message: '正在兑换',
              type: 'pending',
              link: {
                text: '查看详情',
                url: Contract.getExploreTxUrl(txHash),
              },
            });
            await Contract.provider.waitForTransaction(txHash);
            const receipt = await Contract.provider.getTransactionReceipt(txHash);
            console.log('receit done');
            if (receipt.status === 0) {
              notificationSlideStore.show({
                message: '兑换失败',
                type: 'failed',
                link: {
                  text: '查看详情',
                  url: Contract.getExploreTxUrl(txHash),
                },
              });
              state.exchanging = false;
            } else {
              notificationSlideStore.show({
                message: '兑换成功',
                duration: 5000,
                link: {
                  text: '查看详情',
                  url: Contract.getExploreTxUrl(txHash),
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
            <div className="mt-2 mx-auto w-[240px] flex justify-between text-gray-88"><div>Fee(RUM) total:</div><div>{ethers.utils.formatEther(state.exchangeGasLimit.mul(state.gasPrice))}</div></div>
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
              <Transactions data={state.transactions} />
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
});
