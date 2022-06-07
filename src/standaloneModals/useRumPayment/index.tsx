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
import MVMApi, { ICoin } from 'apis/mvm';
import formatAmount from 'utils/formatAmount';
import Loading from 'components/Loading';
import pubkeyToAddr from 'apis/pubkeyToAddr';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { v1 as uuidV1 } from 'uuid';
import useDatabase from 'hooks/useDatabase';
import * as TransferModel from 'hooks/useDatabase/models/transfer';
import * as ethers from 'ethers';
import * as Contract from 'utils/contract';

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
  const { snackbarStore, nodeStore } = useStore();
  const { name, avatar, pubkey, uuid } = props;
  const activeGroup = useActiveGroup();
  const isOwner = activeGroup.user_pubkey === pubkey;

  const state = useLocalObservable(() => ({
    fetched: false,
    step: 0,
    amount: '',
    symbol: '',
    password: '',
    coins: [] as ICoin[],
    balanceMap: {} as Record<string, string>,
    TransferMap: {} as Record<string, string>,
    recipient: '',
    transfersCount: 0,
    pending: false,
    get coin() {
      return this.coins.find((coin) => coin.symbol === state.symbol)!;
    },
  }));

  const getCurrencyIcon = (symbol: string) => state.coins.filter((coin) => coin.symbol === symbol)[0]?.icon;

  React.useEffect(() => {
    (async () => {
      const res = await pubkeyToAddr.get(pubkey);
      if (res && res.addr) {
        state.recipient = res.addr;
      }
    })();
    if (uuid) {
      (
        async () => {
          const transfers = await TransferModel.getTransactions(database, uuid);
          state.transfersCount = new Set<string>(transfers.map((transfer) => transfer.from)).size;
          transfers.forEach((transfer) => {
            if (state.TransferMap[transfer.asset.symbol]) {
              state.TransferMap[transfer.asset.symbol] = formatAmount(String(+state.TransferMap[transfer.asset.symbol] + +transfer.amount));
            } else {
              state.TransferMap[transfer.asset.symbol] = formatAmount(transfer.amount);
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
              state.symbol = selected;
            } else {
              state.symbol = state.coins[0].symbol;
            }
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
        if (state.recipient) {
          state.fetched = true;
        }
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
    if (!state.amount) {
      snackbarStore.show({
        message: lang.require(lang.tokenAmount),
        type: 'error',
      });
      return;
    }
    if (+state.amount > +state.balanceMap[state.symbol]) {
      snackbarStore.show({
        message: lang.amountOverrun,
        type: 'error',
      });
      return;
    }
    state.step = 2;
  };

  const pay = async () => {
    if (state.password !== nodeStore.password) {
      snackbarStore.show({
        message: lang.invalidPassword,
        type: 'error',
      });
      return;
    }
    const privateKey = '0xdb34dc984e792f58f0ac74448a03d92a5e71939cadd32f75d3662229fa0aae3f';
    const contract = new ethers.Contract(state.coin.rumAddress, Contract.RUM_ERC20_ABI, Contract.provider);
    const wallet = new ethers.Wallet(privateKey, Contract.provider);
    const contractWithWallet = contract.connect(wallet);
    state.pending = true;
    await contractWithWallet.rumTransfer(state.recipient, ethers.utils.parseEther(state.amount), `${uuid} ${uuidV1()}`);
    contract.on('Transfer', (from, to) => {
      if (!state.pending) {
        return;
      }
      if (from === wallet.address && to === state.recipient) {
        props.close();
        snackbarStore.show({
          message: '打赏成功',
          duration: 2000,
        });
      }
    });
  };

  const selector = () => (
    <FormControl className="currency-selector w-[240px]" variant="outlined" fullWidth>
      <Select
        value={state.symbol}
        onChange={action((e) => {
          localStorage.setItem('REWARD_CURRENCY', e.target.value as string);
          state.symbol = e.target.value as string;
        })}
        renderValue={(value: any) => (
          <div
            className="flex text-center text-gray-800"
          >
            <div className="w-10 h-10">
              <img
                className="w-10 h-10"
                src={getCurrencyIcon(value)}
                alt={value}
              />
            </div>
            <div className="ml-3 flex items-center flex-col justify-center leading-none currency tracking-wide">
              <span className="">{value}</span>
              <span className="text-xs text-gray-400 mt-[6px]">{state.balanceMap[value]}</span>
            </div>
          </div>
        )}
      >
        {
          state.coins
            .map((coin: ICoin) => (
              <MenuItem className="currency-selector-item" key={coin.id} value={coin.symbol}>
                <div
                  className="w-full h-[26px] rounded px-2 flex items-center text-gray-800 bg-gray-f2"
                >
                  <img
                    className="w-4 h-4"
                    src={coin.icon}
                    alt={coin.name}
                  />
                  <div className="basis-[40px] ml-3 text-14 text-gray-4a leading-none currency tracking-wide">{coin.symbol}</div>
                  <div className="ml-[10px] text-12 text-gray-9c">{state.balanceMap[coin.symbol]}</div>
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
              Object.keys(state.TransferMap).map((symbol) => (
                <div key={symbol} className="mt-4 flex justify-center mb-2">
                  <div className="w-[205px] flex items-center px-2 border-b border-gray-f2 h-6">
                    <img
                      className="w-4 h-4 mr-1"
                      src={getCurrencyIcon(symbol)}
                      alt={symbol}
                    />
                    <span className="text-14 text-gray-4a">{symbol}</span>
                    <span className="flex-grow text-right text-12 text-[#ff931e] mr-2">{state.TransferMap[symbol]}</span>
                    <span className="text-12 text-gray-9c">{symbol}</span>
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
          onChange={(event: any) => {
            const re = /^[0-9]+[.]?[0-9]*$/;
            const { value } = event.target;
            if (value === '' || re.test(value)) {
              state.amount = value;
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
      <Button className="w-[144px] h-10 text-center mt-10 mb-8 rounded-md" onClick={() => check()}>{lang.sureToPay}</Button>
    </div>
  );

  const step2 = () => (
    <div className="w-auto mx-2">
      <div className="mt-4 font-medium text-18 flex justify-center items-center">
        <span className="mr-1 text-gray-4a">{lang.walletPay}</span>
        <span className="mr-1" style={{ color: '#f87171' }}>{state.amount}</span>
        <span className="text-gray-70">{state.symbol}</span>
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
