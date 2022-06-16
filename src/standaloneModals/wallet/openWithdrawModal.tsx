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
import MVMApi, { ICoin, ITransaction } from 'apis/mvm';
import KeystoreApi from 'apis/keystore';
import Loading from 'components/Loading';
import inputFinanceAmount from 'utils/inputFinanceAmount';
import getMixinUID from 'standaloneModals/getMixinUID';
import formatAmount from 'utils/formatAmount';
import useActiveGroup from 'store/selectors/useActiveGroup';
import * as ethers from 'ethers';
import * as Contract from 'utils/contract';
import { User } from 'mixin-node-sdk/src/types/user';
import { MIXIN_BOT_CONFIG } from 'utils/constant';
import sleep from 'utils/sleep';
import getKeyName from 'utils/getKeyName';
import * as MixinSDK from 'mixin-node-sdk';

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
  const { snackbarStore, confirmDialogStore, notificationSlideStore, nodeStore } = useStore();
  const activeGroup = useActiveGroup();
  const state = useLocalObservable(() => ({
    fetched: false,
    symbol: '',
    amount: '',
    open: true,
    coins: [] as ICoin[],
    balanceMap: {} as Record<string, string>,
    transactions: [] as ITransaction[],
    binding: false,
    bondMixinUser: null as User | null,
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
        await fetchBalance();
        if (state.amount === 'skip') {
          await fetchBondMixinUser();
        }
        state.fetched = true;
        await fetchWithdrawTransactions();
      } catch (err) {
        console.log(err);
      }
    })();
  }, []);

  const fetchBalance = React.useCallback(async () => {
    const balances = await Promise.all(state.coins.map(async (coin) => {
      const contractAddress = await MixinSDK.getContractByAssetID(coin.id);
      const contract = new ethers.Contract(contractAddress, Contract.RUM_ERC20_ABI, Contract.provider);
      const balance = await contract.balanceOf(activeGroup.user_eth_addr);
      return `${balance / 1e8}`;
    }));
    for (const [index, coin] of state.coins.entries()) {
      state.balanceMap[coin.symbol] = formatAmount(balances[index]);
    }
  }, []);

  const fetchBondMixinUser = React.useCallback(async () => {
    const contract = new ethers.Contract(Contract.RUM_ACCOUNT_CONTRACT_ADDRESS, Contract.RUM_ACCOUNT_ABI, Contract.provider);
    const accountFromContract = await contract.accounts(activeGroup.user_eth_addr);
    if (accountFromContract && accountFromContract.length > 0) {
      const mixinNodeClient = new MixinSDK.Client(MIXIN_BOT_CONFIG);
      const user = await mixinNodeClient.readUser(accountFromContract[0][2]);
      if (user) {
        state.bondMixinUser = user;
      }
    }
  }, []);

  const fetchWithdrawTransactions = React.useCallback(async () => {
    const res = await MVMApi.transactions({
      account: activeGroup.user_eth_addr,
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
    if (Number(state.amount) > Number(state.balanceMap[state.symbol])) {
      snackbarStore.show({
        message: `最多提取 ${state.balanceMap[state.symbol]} ${state.symbol}`,
        type: 'error',
      });
      return;
    }
    if (!state.bondMixinUser) {
      confirmDialogStore.show({
        content: '您希望提币到哪个 Mixin 帐号？请用它来扫一下码',
        cancelText: '取消',
        okText: '好的',
        ok: async () => {
          confirmDialogStore.hide();
          await sleep(400);
          const mixinUUID = await getMixinUID();
          const mixinUserContractAddress = await MixinSDK.getContractByUserIDs(mixinUUID);
          if (!mixinUserContractAddress) {
            snackbarStore.show({
              message: '请先注册一下用户合约',
              duration: 3000,
            });
            return;
          }
          const mixinAssetContractAddress = await MixinSDK.getContractByAssetID(state.coin.id);
          confirmDialogStore.show({
            content: '确定提币吗？',
            ok: async () => {
              confirmDialogStore.setLoading(true);
              const contract = new ethers.Contract(mixinAssetContractAddress, Contract.RUM_ERC20_ABI, Contract.provider);
              const data = contract.interface.encodeFunctionData('transfer', [
                mixinUserContractAddress,
                String(Number(state.amount) * 1e8),
              ]);
              const [keyName, nonce, gasPrice, network] = await Promise.all([
                getKeyName(nodeStore.storagePath, activeGroup.user_eth_addr),
                Contract.provider.getTransactionCount(activeGroup.user_eth_addr, 'pending'),
                Contract.provider.getGasPrice(),
                Contract.provider.getNetwork(),
              ]);
              if (!keyName) {
                console.log('keyName not found');
                return;
              }
              const { data: signedTrx } = await KeystoreApi.signTx({
                keyname: keyName,
                nonce,
                to: mixinAssetContractAddress,
                value: '0',
                gas_limit: 300000,
                gas_price: gasPrice.toHexString(),
                data,
                chain_id: String(network.chainId),
              });
              const txHash = await Contract.provider.send('eth_sendRawTransaction', [signedTrx]);
              confirmDialogStore.hide();
              state.amount = '';
              notificationSlideStore.show({
                message: '正在提币',
                type: 'pending',
                link: {
                  text: '查看详情',
                  url: Contract.getExploreTxUrl(txHash),
                },
              });
              await Contract.provider.waitForTransaction(txHash);
              const receipt = await Contract.provider.getTransactionReceipt(txHash);
              if (receipt.status === 0) {
                notificationSlideStore.show({
                  message: '提币失败',
                  type: 'failed',
                  link: {
                    text: '查看详情',
                    url: Contract.getExploreTxUrl(txHash),
                  },
                });
              } else {
                await fetchBalance();
                notificationSlideStore.show({
                  message: '提币成功',
                  link: {
                    text: '查看详情',
                    url: Contract.getExploreTxUrl(txHash),
                  },
                });
                await sleep(2000);
                await fetchWithdrawTransactions();
              }
            },
          });
        },
      });
    }
  };

  const bindMixin = async () => {
    const mixinUUID = await getMixinUID();
    const contract = new ethers.Contract(Contract.RUM_ACCOUNT_CONTRACT_ADDRESS, Contract.RUM_ACCOUNT_ABI, Contract.provider);
    const data = contract.interface.encodeFunctionData('selfBind', [
      'MIXIN',
      mixinUUID,
      '{"request":{"type":"MIXIN"}}',
      '',
    ]);
    const [keyName, nonce, gasPrice, network] = await Promise.all([
      getKeyName(nodeStore.storagePath, activeGroup.user_eth_addr),
      Contract.provider.getTransactionCount(activeGroup.user_eth_addr, 'pending'),
      Contract.provider.getGasPrice(),
      Contract.provider.getNetwork(),
    ]);
    if (!keyName) {
      console.log('keyName not found');
      return;
    }
    const { data: signedTrx } = await KeystoreApi.signTx({
      keyname: keyName,
      nonce,
      to: Contract.RUM_ACCOUNT_CONTRACT_ADDRESS,
      value: '0',
      gas_limit: 300000,
      gas_price: gasPrice.toHexString(),
      data,
      chain_id: String(network.chainId),
    });
    const txHash = await Contract.provider.send('eth_sendRawTransaction', [signedTrx]);
    notificationSlideStore.show({
      message: '正在绑定',
      type: 'pending',
      link: {
        text: '查看详情',
        url: Contract.getExploreTxUrl(txHash),
      },
    });
    await Contract.provider.waitForTransaction(txHash);
    const receipt = await Contract.provider.getTransactionReceipt(txHash);
    if (receipt.status === 0) {
      notificationSlideStore.show({
        message: '绑定失败',
        type: 'failed',
        link: {
          text: '查看详情',
          url: Contract.getExploreTxUrl(txHash),
        },
      });
    } else {
      await fetchBondMixinUser();
      notificationSlideStore.show({
        message: '绑定成功',
        link: {
          text: '查看详情',
          url: Contract.getExploreTxUrl(txHash),
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
              {state.bondMixinUser && (
                <div className="flex justify-center items-center mt-2 text-gray-400 text-12 opacity-80">
                  接收币种的 Mixin 帐号:
                  <Tooltip
                    placement="bottom"
                    title="点击可以重新绑定"
                    arrow
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
              <Transactions data={state.transactions} />
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
});
