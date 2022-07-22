import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { TextField, FormControl, Select, MenuItem } from '@material-ui/core';
import Button from 'components/Button';
import { StoreProvider, useStore } from 'store';
import { ThemeRoot } from 'utils/theme';
import { lang } from 'utils/lang';
import Avatar from 'components/Avatar';
import { action } from 'mobx';
import PasswordInput from 'components/PasswordInput';
import MVMApi, { ICoin, INativeCoin } from 'apis/mvm';
import formatAmount from 'utils/formatAmount';
import Loading from 'components/Loading';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { v1 as uuidV1 } from 'uuid';
import useDatabase from 'hooks/useDatabase';
import * as TransferModel from 'hooks/useDatabase/models/transfer';
import * as ethers from 'ethers';
import * as Contract from 'utils/contract';
import KeystoreApi from 'apis/keystore';
import getKeyName from 'utils/getKeyName';
import inputFinanceAmount from 'utils/inputFinanceAmount';
import openDepositModal from './openDepositModal';
import sleep from 'utils/sleep';
import { pubkeyToAddr } from 'utils/pubkeyToAddr';

export default async (props: { name: string, avatar: string, pubkey: string, uuid?: string }) => new Promise<void>((rs) => {
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
          <RumPaymentModel
            {...props}
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

const RumPaymentModel = observer((props: any) => {
  const state = useLocalObservable(() => ({
    open: true,
  }));
  const close = () => {
    state.open = false;
    props.rs();
  };
  return (
    <Dialog
      open={state.open}
      onClose={close}
      transitionDuration={{
        enter: 300,
      }}
    >
      <RumPayment close={close} {...props} />
    </Dialog>
  );
});

const RumPayment = observer((props: any) => {
  const database = useDatabase();
  const { snackbarStore, notificationSlideStore, confirmDialogStore, nodeStore } = useStore();
  const { name, avatar, pubkey, uuid } = props;
  const activeGroup = useActiveGroup();
  const isOwner = activeGroup.user_pubkey === pubkey;

  const state = useLocalObservable(() => ({
    fetched: false,
    step: 0,
    amount: '',
    rumSymbol: '',
    password: '',
    coins: [] as Array<ICoin | INativeCoin>,
    balanceMap: {} as Record<string, string>,
    TransferMap: {} as Record<string, string>,
    recipient: '',
    transfersCount: 0,
    get coin() {
      return this.coins.find((coin) => coin.rumSymbol === state.rumSymbol)!;
    },
    get transferGasLimit() {
      if (state.rumSymbol === 'RUM') {
        return ethers.BigNumber.from(21000);
      }
      return ethers.BigNumber.from(100000);
    },
    gasPrice: ethers.BigNumber.from(0),
  }));

  const getCurrencyIcon = (rumSymbol: string) => state.coins.filter((coin) => coin.rumSymbol === rumSymbol)[0]?.icon;
  const getCurrencySymbol = (rumSymbol: string) => state.coins.filter((coin) => coin.rumSymbol === rumSymbol)[0]?.symbol;

  React.useEffect(() => {
    try {
      state.recipient = pubkeyToAddr(pubkey);
    } catch {
      snackbarStore.show({
        message: lang.wrongPubkey,
        type: 'error',
      });
      props.close();
    }
    if (uuid) {
      (
        async () => {
          const transfers = await TransferModel.getTransactions(database, uuid);
          state.transfersCount = new Set<string>(transfers.map((transfer) => transfer.from)).size;
          transfers.forEach((transfer) => {
            if (state.TransferMap[transfer.asset.rumSymbol]) {
              state.TransferMap[transfer.asset.rumSymbol] = formatAmount(String(+state.TransferMap[transfer.asset.rumSymbol] + +transfer.amount));
            } else {
              state.TransferMap[transfer.asset.rumSymbol] = formatAmount(transfer.amount);
            }
          });
        }
      )();
    }
    const fetchData = async () => {
      try {
        {
          const res = await MVMApi.coins();
          state.coins = Object.values(res.data);
          if (!state.fetched && state.coins.length > 0) {
            const selected = localStorage.getItem('REWARD_CURRENCY');
            if (selected && selected in res.data) {
              state.rumSymbol = selected;
            } else {
              state.rumSymbol = state.coins[0].rumSymbol;
            }
          }
        }
        {
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
        }
        {
          const gasPrice = await Contract.provider.getGasPrice();
          state.gasPrice = gasPrice;
        }
        if (state.recipient) {
          state.fetched = true;
        }
      } catch (err) {
        console.log(err);
      }
    };
    fetchData();
    const timer = setInterval(fetchData, 10000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const startTip = () => {
    if (isOwner) {
      snackbarStore.show({
        message: lang.canNotTipYourself,
        type: 'error',
      });
      return;
    }
    state.step = 1;
  };

  const check = () => {
    if (!state.recipient) {
      snackbarStore.show({
        message: lang.failToGetRecipientAddr,
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
    if (
      state.rumSymbol === 'RUM'
      && (+ethers.utils.formatEther(ethers.utils.parseEther(state.amount).add(state.transferGasLimit.mul(state.gasPrice))) > +state.balanceMap.RUM)
    ) {
      confirmDialogStore.show({
        content: `您的余额不足 ${ethers.utils.formatEther(ethers.utils.parseEther(state.amount).add(state.transferGasLimit.mul(state.gasPrice)))} ${state.coin?.symbol || ''}`,
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
    if (+state.amount > +state.balanceMap[state.rumSymbol]) {
      confirmDialogStore.show({
        content: `您的余额不足 ${state.amount} ${state.coin?.symbol || ''}`,
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
    if (+ethers.utils.formatEther(state.transferGasLimit.mul(state.gasPrice)) > +state.balanceMap.RUM) {
      confirmDialogStore.show({
        content: `您的 *RUM 不足 ${ethers.utils.formatEther(state.transferGasLimit.mul(state.gasPrice))}`,
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
      content: `确定支付 ${state.amount} ${state.coin?.symbol || ''} 吗？`,
      ok: async () => {
        if (confirmDialogStore.loading) {
          return;
        }
        confirmDialogStore.setLoading(true);
        console.log('paid');
        try {
          if (state.rumSymbol === 'RUM') {
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
              to: state.recipient,
              value: ethers.utils.parseEther(state.amount).toHexString(),
              gas_limit: state.transferGasLimit.toNumber(),
              gas_price: state.gasPrice.toHexString(),
              data: '0x',
              chain_id: String(network.chainId),
            });
            console.log('signTx done');
            const txHash = await Contract.provider.send('eth_sendRawTransaction', [signedTrx]);
            console.log('send done');
            confirmDialogStore.hide();
            props.close();
            notificationSlideStore.show({
              message: '正在打赏',
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
                message: '打赏失败',
                type: 'failed',
                link: {
                  text: '查看详情',
                  url: Contract.getExploreTxUrl(txHash),
                },
              });
            } else {
              notificationSlideStore.show({
                message: '打赏成功',
                duration: 5000,
                link: {
                  text: '查看详情',
                  url: Contract.getExploreTxUrl(txHash),
                },
              });
            }
          } else {
            const contract = new ethers.Contract(state.coin.rumAddress, Contract.RUM_ERC20_ABI, Contract.provider);
            const data = contract.interface.encodeFunctionData('rumTransfer', [
              state.recipient,
              ethers.utils.parseEther(state.amount),
              `${uuid} ${uuidV1()}`,
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
              to: state.coin.rumAddress,
              value: '0',
              gas_limit: state.transferGasLimit.toNumber(),
              gas_price: state.gasPrice.toHexString(),
              data,
              chain_id: String(network.chainId),
            });
            console.log('signTx done');
            const txHash = await Contract.provider.send('eth_sendRawTransaction', [signedTrx]);
            console.log('send done');
            confirmDialogStore.hide();
            props.close();
            notificationSlideStore.show({
              message: '正在打赏',
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
                message: '打赏失败',
                type: 'failed',
                link: {
                  text: '查看详情',
                  url: Contract.getExploreTxUrl(txHash),
                },
              });
            } else {
              notificationSlideStore.show({
                message: '打赏成功',
                duration: 5000,
                link: {
                  text: '查看详情',
                  url: Contract.getExploreTxUrl(txHash),
                },
              });
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
          snackbarStore.show({
            message,
            type: 'error',
          });
        }
      },
    });
    // state.step = 2;
  };

  const pay = () => {
    // if (state.password !== nodeStore.password) {
    //   snackbarStore.show({
    //     message: lang.invalidPassword,
    //     type: 'error',
    //   });
    //   return;
    // }
  };

  const selector = () => (
    <FormControl className="currency-selector w-[240px]" variant="outlined" fullWidth>
      <Select
        value={state.rumSymbol}
        onChange={action((e) => {
          localStorage.setItem('REWARD_CURRENCY', e.target.value as string);
          state.rumSymbol = e.target.value as string;
          state.amount = '';
          if (state.balanceMap[state.rumSymbol] === '0') {
            confirmDialogStore.show({
              content: `您的 ${state.coin?.symbol || ''} 余额是 0`,
              okText: '去充值',
              ok: async () => {
                confirmDialogStore.hide();
                await sleep(300);
                openDepositModal({
                  rumSymbol: state.rumSymbol,
                });
              },
            });
          }
        })}
        renderValue={(value: any) => (
          <div
            className="flex text-center text-gray-800"
          >
            <div className="w-10 h-10">
              <img
                className="w-10 h-10"
                src={getCurrencyIcon(value)}
                alt={state.coin?.symbol || ''}
              />
            </div>
            <div className="ml-3 flex items-center flex-col justify-center leading-none currency tracking-wide">
              <span className="">{value === 'RUM' ? '*' : '' }{state.coin?.symbol || ''}</span>
              <span className="text-xs text-gray-400 mt-[6px]">{state.balanceMap[value]}</span>
            </div>
          </div>
        )}
      >
        {
          state.coins
            .map((coin: ICoin | INativeCoin) => (
              <MenuItem className="currency-selector-item" key={coin.rumSymbol} value={coin.rumSymbol}>
                <div
                  className="w-full h-[26px] rounded px-2 flex items-center text-gray-800 bg-gray-f2"
                >
                  <img
                    className="w-4 h-4"
                    src={coin.icon}
                    alt={coin.name}
                  />
                  <div className="basis-[40px] ml-3 text-14 text-gray-4a leading-none currency tracking-wide">{coin.rumSymbol === 'RUM' ? '*' : '' }{coin.symbol}</div>
                  <div className="ml-[10px] text-12 text-gray-9c">{state.balanceMap[coin.rumSymbol]}</div>
                </div>
              </MenuItem>
            ))
        }
      </Select>
      <style jsx>{`
        .currency {
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial,
            Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol,
            Noto Color Emoji;
        }
      `}</style>
      <style jsx global>{`
        .currency-selector .MuiSelect-root {
          height: 55px !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          display: flex !important;
          align-items: center !important;
        }
        .currency-selector-item.MuiListItem-root.Mui-selected {
          background-color: unset !important;
        }
      `}</style>
    </FormControl>
  );

  const step0 = () => (
    <div className="w-auto mx-2 mb-4">
      <div className="font-medium text-16 text-base flex justify-center items-center" style={{ color: '#374151' }}>
        {lang.toAuthor} {name} {lang.tip}
      </div>
      <Avatar
        className="mt-[30px] mx-auto"
        url={avatar}
        size={80}
      />
      <Button className="w-[144px] h-10 text-center mt-4 rounded-md" onClick={startTip}>{lang.tipToAuthor}</Button>
      {
        state.transfersCount > 0 && (
          <>
            <div className="mt-7 text-gray-af flex items-center justify-center">
              <div className="mr-2 w-6 border-t border-gray-f2" /> {state.transfersCount}{'人打赏'} <div className="ml-2 w-6 border-t border-gray-f2" />
            </div>
            {
              Object.keys(state.TransferMap).map((rumSymbol) => (
                <div key={rumSymbol} className="mt-4 flex justify-center mb-2">
                  <div className="w-[205px] flex items-center px-2 border-b border-gray-f2 h-6">
                    <img
                      className="w-4 h-4 mr-1"
                      src={getCurrencyIcon(rumSymbol)}
                      alt={getCurrencySymbol(rumSymbol)}
                    />
                    <span className="text-14 text-gray-4a">{getCurrencySymbol(rumSymbol)}</span>
                    <span className="flex-grow text-right text-12 text-[#ff931e] mr-2">{state.TransferMap[rumSymbol]}</span>
                    <span className="text-12 text-gray-9c">{getCurrencySymbol(rumSymbol)}</span>
                  </div>
                </div>
              ))

            }
          </>
        )
      }
    </div>
  );

  const step1 = () => (
    <div className="w-auto mx-2">
      <div className="font-medium text-16 text-base flex justify-center items-center" style={{ color: '#374151' }}>
        {lang.tipToAuthor} {name}
      </div>
      <Avatar
        className="mt-[30px] mx-auto"
        url={avatar}
        size={80}
      />
      <div className="mt-9 text-gray-800">
        {selector()}
        <TextField
          className="w-[240px]"
          value={state.amount}
          placeholder={lang.inputAmount}
          onChange={(e) => {
            const amount = inputFinanceAmount(e.target.value);
            if (amount !== null) {
              state.amount = amount;
            }
          }}
          margin="normal"
          variant="outlined"
          autoFocus
          fullWidth
          onKeyPress={(e: any) => e.key === 'Enter' && check()}
          InputProps={{
            inputProps: { maxLength: 8, type: 'text' },
          }}
        />
      </div>
      <div className="mx-auto w-[240px] flex justify-between text-gray-88"><div>Fee(*RUM) total:</div><div>{ethers.utils.formatEther(state.transferGasLimit.mul(state.gasPrice))}</div></div>
      <Button className="w-[144px] h-10 text-center mt-10 mb-8 rounded-md" onClick={() => check()}>{lang.sureToPay}</Button>
    </div>
  );

  const step2 = () => (
    <div className="w-auto mx-2">
      <div className="mt-4 font-medium text-18 flex justify-center items-center">
        <span className="mr-1 text-gray-4a">{lang.walletPay}</span>
        <span className="mr-1" style={{ color: '#f87171' }}>{state.amount}</span>
        <span className="text-gray-70">{state.coin?.symbol || ''}</span>
      </div>
      <div className="mt-9 text-gray-800">
        <PasswordInput
          className="w-[240px]"
          placeholder={lang.inputPassword}
          size="small"
          value={state.password}
          onChange={action((e) => { state.password = e.target.value; })}
          margin="dense"
          variant="outlined"
          type="password"
        />
      </div>
      <div className="flex items-center justify-between">
        <Button className="w-[144px] h-10 text-center mt-10 mb-8 rounded-md" outline onClick={() => props.close()}>{lang.cancel}</Button>
        <Button className="w-[144px] h-10 text-center mt-10 mb-8 rounded-md" onClick={() => pay()}>{lang.yes}</Button>
      </div>
    </div>
  );


  return (
    <div className="w-100 bg-white rounded-0 text-center pt-8 pb-6 px-10">
      {!state.fetched && (
        <div className="h-40 flex items-center justify-center">
          <Loading />
        </div>
      )}
      { state.fetched && state.step === 0 && step0()}
      { state.fetched && state.step === 1 && step1()}
      { state.fetched && state.step === 2 && step2()}
    </div>
  );
});
