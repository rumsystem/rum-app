import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { TextField, FormControl, Select, MenuItem } from '@material-ui/core';
import Button from 'components/Button';
import { StoreProvider, useStore } from 'store';
import { checkAmount, CURRENCIES } from './utils';
import { ThemeRoot } from 'utils/theme';
import { lang } from 'utils/lang';
import Avatar from 'components/Avatar';
import { action } from 'mobx';
import { shell } from '@electron/remote';
import PasswordInput from 'components/PasswordInput';

import IconBOX from 'assets/currency_icons/BOX.png';
import IconBTC from 'assets/currency_icons/BTC.png';
import IconCNB from 'assets/currency_icons/CNB.png';
import IconDOGE from 'assets/currency_icons/DOGE.png';
import IconEOS from 'assets/currency_icons/EOS.png';
import IconETH from 'assets/currency_icons/ETH.png';
import IconMOB from 'assets/currency_icons/MOB.png';
import IconPUSD from 'assets/currency_icons/PUSD.png';
import IconRUM from 'assets/currency_icons/RUM.png';
import IconUSDC from 'assets/currency_icons/USDC.png';
import IconUSDT from 'assets/currency_icons/USDT.png';
import IconXIN from 'assets/currency_icons/XIN.png';

const icons: Record<string, string> = {
  BOX: IconBOX,
  BTC: IconBTC,
  CNB: IconCNB,
  DOGE: IconDOGE,
  EOS: IconEOS,
  ETH: IconETH,
  MOB: IconMOB,
  PUSD: IconPUSD,
  RUM: IconRUM,
  USDC: IconUSDC,
  USDT: IconUSDT,
  XIN: IconXIN,
};

const getCurrencyIcon = (currency: string) => icons[currency];

export default async (props: { name: string, avatar: string, mixinUID: string }) => new Promise<void>((rs) => {
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
  const { snackbarStore, nodeStore } = useStore();
  const { name, avatar } = props;

  const state = useLocalObservable(() => ({
    step: 1,
    amount: '',
    memo: '',
    selectedCurrency: localStorage.getItem('REWARD_CURRENCY') || '',
    search: '',
    paymentUrl: '',
    trace: '',
    timer: null as any,
    password: '',
  }));

  const check = () => {
    const result = checkAmount(state.amount);
    if (result.ok) {
      state.step = 2;
    } else {
      snackbarStore.show(result as any);
    }
  };

  const pay = () => {
    if (state.password === nodeStore.password) {
      shell.openExternal('https://rumsystem.net/');
    } else {
      snackbarStore.show({
        message: lang.invalidPassword,
        type: 'error',
      });
    }
  };

  const selector = () => (
    <FormControl className="currency-selector w-[240px]" variant="outlined" fullWidth>
      <Select
        value={state.selectedCurrency}
        onChange={action((e) => {
          localStorage.setItem('REWARD_CURRENCY', e.target.value as string);
          state.selectedCurrency = e.target.value as string;
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
            <div className="ml-3 flex flex-col items-start justify-between leading-none currency tracking-wide">
              <span className="">{value}</span>
              <span className="text-xs text-gray-400">100</span>
            </div>
          </div>
        )}
      >
        {
          CURRENCIES
            .filter((currency: any) => currency.token.includes(state.search.toUpperCase()) || currency.name.toLowerCase().includes(state.search.toLowerCase()))
            .map((currency: any) => (
              <MenuItem className="currency-selector-item" key={currency.token} value={currency.token}>
                <div
                  className="w-full h-[26px] rounded px-2 flex items-center text-gray-800 bg-gray-f2"
                >
                  <img
                    className="w-4 h-4"
                    src={getCurrencyIcon(currency.token)}
                    alt={currency.token}
                  />
                  <div className="ml-3 text-14 text-gray-4a leading-none currency tracking-wide">{currency.token}</div>
                  <div className="ml-[10px] text-12 text-gray-9c">12345</div>
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
      <div className="font-medium text-16 text-base flex justify-center items-center" style={{ color: '#374151' }}>
        {lang.walletPay}
      </div>
      <div className="mt-4 font-medium text-16 text-base flex justify-center items-center">
        <span className="mr-1 text-gray-4a">{lang.walletPay}</span>
        <span className="mr-1" style={{ color: '#f87171' }}>{state.amount}</span>
        <span className="text-gray-70">{state.selectedCurrency}</span>
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
      { state.step === 1 && step1()}
      { state.step === 2 && step2()}
    </div>
  );
});
