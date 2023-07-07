import React from 'react';
import { createRoot } from 'react-dom/client';
import { action, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { TextField, FormControl, Select, MenuItem, InputLabel, FormHelperText, Tooltip } from '@mui/material';
import { StoreProvider, useStore } from 'store';
import { ThemeRoot } from 'utils/theme';
import { lang } from 'utils/lang';
import Transactions from './transactions';
import MVMApi, { ICoin, INativeCoin, ITransaction } from 'apis/mvm';
import KeystoreApi from 'apis/keystore';
import Loading from 'components/Loading';
import inputFinanceAmount from 'utils/inputFinanceAmount';
import getMixinUID from 'standaloneModals/getMixinUID';
import formatAmount from 'utils/formatAmount';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { Contract, formatEther, parseEther } from 'ethers';
import * as ContractUtils from 'utils/contract';
import { Client, type User } from 'mixin-node-sdk';
import { MIXIN_BOT_CONFIG } from 'utils/constant';
import sleep from 'utils/sleep';
import getKeyName from 'utils/getKeyName';
import openDepositModal from './openDepositModal';

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
        <Deposit
          rumSymbol={props ? props.rumSymbol : ''}
          rs={() => {
            setTimeout(unmount, 3000);
          }}
        />
      </StoreProvider>
    </ThemeRoot>,
  );
};

interface IWithdrawProps extends IProps {
  rs: () => void
}

const Deposit = observer((props: IWithdrawProps) => {
  const { snackbarStore, confirmDialogStore, notificationSlideStore, nodeStore } = useStore();
  const activeGroup = useActiveGroup();
  const state = useLocalObservable(() => ({
    fetched: false,
    rumSymbol: '',
    amount: '',
    open: true,
    coins: [] as Array<ICoin | INativeCoin>,
    balanceMap: {} as Record<string, string>,
    transactions: [] as ITransaction[],
    binding: false,
    bondMixinUser: null as User | null,
    get coin() {
      return this.coins.find((coin) => coin.rumSymbol === state.rumSymbol)!;
    },
    get transferGasLimit() {
      if (state.rumSymbol === 'RUM') {
        return 21000n;
      }
      return 300000n;
    },
    bindAccountGasLimit: 1000000n,
    gasPrice: 0n,
  }));

  React.useEffect(() => {
    (async () => {
      try {
        {
          const res = await MVMApi.coins();
          state.coins = Object.values(res.data);
          if (!state.fetched && props && res.data[props.rumSymbol]) {
            state.rumSymbol = props.rumSymbol;
          }
        }
        await fetchBalance();
        await fetchBondMixinUser();
        state.fetched = true;
        await fetchWithdrawTransactions();
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
    {
      const gasPrice = (await ContractUtils.provider.getFeeData()).gasPrice;
      state.gasPrice = gasPrice ?? 0n;
    }
  }, []);

  const fetchBondMixinUser = React.useCallback(async () => {
    const contract = new Contract(ContractUtils.RUM_ACCOUNT_CONTRACT_ADDRESS, ContractUtils.RUM_ACCOUNT_ABI, ContractUtils.provider);
    const accountFromContract = await contract.accounts(activeGroup.user_eth_addr);
    if (accountFromContract && accountFromContract.length > 0) {
      const mixinNodeClient = new Client(MIXIN_BOT_CONFIG);
      const user = await mixinNodeClient.readUser(accountFromContract[0][2]);
      if (user) {
        state.bondMixinUser = user;
      }
    }
  }, []);

  const fetchWithdrawTransactions = React.useCallback(async () => {
    const res = await MVMApi.transactions({
      address: activeGroup.user_eth_addr,
      count: 1000,
      sort: 'DESC',
    });
    state.transactions = res.data.filter((t) => t.type === 'WITHDRAW');
  }, []);

  const handleClose = action(() => {
    props.rs();
    state.open = false;
  });

  const handleSubmit = () => {
    if (!state.rumSymbol) {
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
    if (
      state.rumSymbol === 'RUM'
      && (+formatEther(parseEther(state.amount) + state.transferGasLimit * state.gasPrice) > +state.balanceMap.RUM)
    ) {
      let message = '最多提取 0 RUM';
      if (+state.balanceMap.RUM > +formatEther(state.transferGasLimit * state.gasPrice)) {
        message = `最多提取 ${formatEther(parseEther(state.balanceMap.RUM) - state.transferGasLimit * state.gasPrice)} RUM`;
      }
      snackbarStore.show({
        message,
        type: 'error',
      });
      return;
    }
    if (+state.amount > +state.balanceMap[state.rumSymbol]) {
      snackbarStore.show({
        message: `最多提取 ${state.balanceMap[state.rumSymbol]} ${state.coin?.rumSymbol || ''}`,
        type: 'error',
      });
      return;
    }
    if (+formatEther(state.transferGasLimit * state.gasPrice) > +state.balanceMap.RUM) {
      confirmDialogStore.show({
        content: `您的 RUM 不足 ${formatEther(state.transferGasLimit * state.gasPrice)}`,
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
    if (!state.bondMixinUser) {
      confirmDialogStore.show({
        content: '请先绑定你要用来接收币种的 Mixin 帐号',
        cancelText: '取消',
        okText: '去绑定',
        ok: async () => {
          confirmDialogStore.hide();
          await sleep(400);
          bindMixin();
        },
      });
      return;
    }

    confirmDialogStore.show({
      content: '确定提币吗？',
      ok: async () => {
        confirmDialogStore.setLoading(true);
        console.log('withdraw');
        try {
          if (state.rumSymbol === 'RUM') {
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
              to: ContractUtils.WITHDRAW_TO,
              value: `0x${parseEther(state.amount).toString(16)}`,
              gas_limit: Number(state.transferGasLimit),
              gas_price: `0x${state.gasPrice.toString(16)}`,
              data: '0x',
              chain_id: String(network.chainId),
            });
            console.log('signTx done');
            const txHash = await ContractUtils.provider.send('eth_sendRawTransaction', [signedTrx]);
            console.log('send done');
            confirmDialogStore.hide();
            state.amount = '';
            notificationSlideStore.show({
              message: '正在提币',
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
                message: '提币失败',
                type: 'failed',
                link: {
                  text: '查看详情',
                  url: ContractUtils.getExploreTxUrl(txHash),
                },
              });
            } else {
              await fetchBalance();
              notificationSlideStore.show({
                message: '提币成功',
                link: {
                  text: '查看详情',
                  url: ContractUtils.getExploreTxUrl(txHash),
                },
              });
              await sleep(2000);
              await fetchWithdrawTransactions();
            }
          } else {
            const contract = new Contract(state.coin.rumAddress, ContractUtils.RUM_ERC20_ABI, ContractUtils.provider);
            const data = contract.interface.encodeFunctionData('transfer', [
              ContractUtils.WITHDRAW_TO,
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
              to: state.coin.rumAddress,
              value: '0',
              gas_limit: Number(state.transferGasLimit),
              gas_price: `0x${state.gasPrice.toString(16)}`,
              data,
              chain_id: String(network.chainId),
            });
            console.log('signTx done');
            const txHash = await ContractUtils.provider.send('eth_sendRawTransaction', [signedTrx]);
            console.log('send done');
            confirmDialogStore.hide();
            state.amount = '';
            notificationSlideStore.show({
              message: '正在提币',
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
                message: '提币失败',
                type: 'failed',
                link: {
                  text: '查看详情',
                  url: ContractUtils.getExploreTxUrl(txHash),
                },
              });
            } else {
              await fetchBalance();
              notificationSlideStore.show({
                message: '提币成功',
                link: {
                  text: '查看详情',
                  url: ContractUtils.getExploreTxUrl(txHash),
                },
              });
              await sleep(2000);
              await fetchWithdrawTransactions();
            }
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
        }
      },
    });
  };

  const bindMixin = async () => {
    const mixinUUID = await getMixinUID();
    console.log('bind');
    try {
      const contract = new Contract(ContractUtils.RUM_ACCOUNT_CONTRACT_ADDRESS, ContractUtils.RUM_ACCOUNT_ABI, ContractUtils.provider);
      const data = contract.interface.encodeFunctionData('selfBind', [
        'MIXIN',
        mixinUUID,
        '{"request":{"type":"MIXIN"}}',
        '',
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
        to: ContractUtils.RUM_ACCOUNT_CONTRACT_ADDRESS,
        value: '0',
        gas_limit: Number(state.bindAccountGasLimit),
        gas_price: `0x${state.gasPrice.toString(16)}`,
        data,
        chain_id: String(network.chainId),
      });
      console.log('signTx done');
      const txHash = await ContractUtils.provider.send('eth_sendRawTransaction', [signedTrx]);
      console.log('send done');
      notificationSlideStore.show({
        message: '正在绑定',
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
          message: '绑定失败',
          type: 'failed',
          link: {
            text: '查看详情',
            url: ContractUtils.getExploreTxUrl(txHash),
          },
        });
      } else {
        await Promise.all([fetchBalance(), fetchBondMixinUser()]);
        notificationSlideStore.show({
          message: '绑定成功',
          link: {
            text: '查看详情',
            url: ContractUtils.getExploreTxUrl(txHash),
          },
        });
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
            <div className="text-20 font-bold text-gray-4a">提币</div>
            <div className="pt-8 w-60 mx-auto">
              <FormControl
                className="w-full text-left"
                size="small"
                variant="outlined"
              >
                <InputLabel>选择币种</InputLabel>
                <Select
                  value={state.rumSymbol}
                  label="选择币种"
                  onChange={(e) => runInAction(() => {
                    state.rumSymbol = e.target.value;
                    state.amount = '';
                  })}
                >
                  {state.coins.map((coin) => (
                    <MenuItem key={coin.rumSymbol} value={coin.rumSymbol} className="flex items-center leading-none">{coin.rumSymbol}
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
                {state.rumSymbol && (
                  <FormHelperText className="opacity-60 text-12">
                    可提币数量: {state.balanceMap[state.rumSymbol]}
                  </FormHelperText>
                )}
                <FormHelperText className="opacity-60 text-12 mx-auto w-[240px] flex justify-between text-gray-88">
                  <div>Fee(RUM) total:</div><div>{formatEther(state.transferGasLimit * state.gasPrice)}</div>
                </FormHelperText>
              </FormControl>
              <div className="mt-6">
                <Button
                  className="rounded w-full"
                  onClick={handleSubmit}
                >
                  {lang.yes}
                </Button>
              </div>
              {state.bondMixinUser && (
                <div className="flex justify-center items-center mt-2 text-gray-400 text-12 opacity-80">
                  接收币种的 Mixin 帐号:
                  <Tooltip
                    placement="bottom"
                    title="点击可以重新绑定"
                    arrow
                    disableInteractive
                  >
                    <span className="font-bold ml-1 cursor-pointer" onClick={bindMixin}>{state.bondMixinUser.full_name}</span>
                  </Tooltip>
                  ({state.bondMixinUser.identity_number})
                </div>
              )}
            </div>
            <div className="py-10">
              <div className="text-16 py-3 text-left font-bold text-gray-6f">
                提币记录
              </div>
              <Transactions data={state.transactions} myAddress={activeGroup.user_eth_addr} />
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
});
