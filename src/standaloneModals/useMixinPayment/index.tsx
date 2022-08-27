import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import classNames from 'classnames';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Loading from 'components/Loading';
import { TextField, Tooltip } from '@material-ui/core';
import { MdInfo } from 'react-icons/md';
import Button from 'components/Button';
import { isWindow } from 'utils/env';
import { StoreProvider, useStore } from 'store';
import { getPaymentStatus } from 'apis/mixin';
import InputAdornment from '@material-ui/core/InputAdornment';
import { checkAmount, CURRENCIES, getMixinPaymentUrl } from './utils';
import { v1 as uuidV1 } from 'uuid';
import { ThemeRoot } from 'utils/theme';
import { BsQuestionCircleFill } from 'react-icons/bs';
import { lang } from 'utils/lang';

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

export default async (props: { name: string, mixinUID: string }) => new Promise<void>((rs) => {
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
          <MixinPaymentModel
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

const MixinPaymentModel = observer((props: any) => {
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
      <MixinPayment close={close} {...props} />
    </Dialog>
  );
});

const MixinPayment = observer((props: any) => {
  const { snackbarStore } = useStore();
  const { name, mixinUID } = props;

  const state = useLocalObservable(() => ({
    step: localStorage.getItem('REWARD_CURRENCY') ? 2 : 1,
    amount: '',
    memo: '',
    selectedCurrency: localStorage.getItem('REWARD_CURRENCY') || '',
    search: '',
    iframeLoading: false,
    paymentUrl: '',
    trace: '',
    timer: null as any,
  }));

  const checkPayment = React.useCallback(async () => {
    const res = await getPaymentStatus({
      counter_user_id: mixinUID,
      asset_id: CURRENCIES.filter((currency: any) => currency.token === state.selectedCurrency)[0]?.asset_id,
      amount: state.amount,
      trace_id: state.trace,
    });
    if (res?.data?.status === 'paid') {
      snackbarStore.show({
        message: lang.tipped,
      });
      props.close();
    }
  }, []);

  React.useEffect(() => {
    if (state.step === 3) {
      state.timer = setInterval(checkPayment, 200);
    }
    return () => {
      if (state.timer) {
        clearInterval(state.timer);
      }
    };
  }, [state, state.step]);

  const pay = () => {
    const result = checkAmount(state.amount);
    if (result.ok) {
      state.iframeLoading = true;
      state.trace = uuidV1();
      state.paymentUrl = getMixinPaymentUrl({
        toMixinClientId: mixinUID,
        asset: CURRENCIES.filter((currency: any) => currency.token === state.selectedCurrency)[0]?.asset_id,
        amount: state.amount,
        trace: state.trace,
        memo: state.memo,
      });
      state.step = 3;
    } else {
      snackbarStore.show(result as any);
    }
  };

  const step1 = () => (
    <div>
      <div className="text-lg font-bold text-gray-700 -mt-1">{lang.selectToken}</div>
      <TextField
        className="w-full mt-6 currency-search-input"
        placeholder={lang.search}
        size="small"
        value={state.search}
        onChange={(e) => {
          state.search = e.target.value.trim();
        }}
        margin="dense"
        variant="outlined"
      />
      <div className="mt-3 w-64 pb-2 h-72 overflow-scroll">
        {
          CURRENCIES
            .filter((currency: any) => currency.token.includes(state.search.toUpperCase()) || currency.name.toLowerCase().includes(state.search.toLowerCase()))
            .map((currency: any) => (
              <div key={currency.token} className="py-1" title={currency.token}>
                <div
                  className="flex text-center py-2 cursor-pointer text-gray-800 hover:bg-gray-100 px-2"
                  onClick={() => {
                    localStorage.setItem('REWARD_CURRENCY', currency.token);
                    state.selectedCurrency = currency.token;
                    state.step = 2;
                  }}
                >
                  <div className="w-6 h-6">
                    <img
                      className="w-6 h-6"
                      src={getCurrencyIcon(currency.token)}
                      alt={currency.token}
                    />
                  </div>
                  <div className="ml-3 flex flex-col items-start justify-between leading-none currency tracking-wide">
                    <span className="">{currency.token}</span>
                    <span className="text-xs text-gray-400">{currency.name}</span>
                  </div>
                </div>
              </div>
            ))
        }
      </div>
      <style jsx>{`
        .currency {
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial,
            Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol,
            Noto Color Emoji;
        }
      `}</style>
      <style jsx global>{`
        .currency-search-input .MuiOutlinedInput-root {
          border-radius: 30px !important;
        }
        .currency-search-input .MuiOutlinedInput-input {
          padding-left: 20px;
        }
      `}</style>
    </div>
  );

  const step2 = () => (
    <div className="w-auto mx-2">
      <div className="text-base text-gray-700 flex justify-center items-center">
        {lang.tipTo}<span className="font-bold ml-1">{name}</span>
        <Tooltip
          enterDelay={200}
          enterNextDelay={200}
          placement="top"
          title={lang.tipByMixinPrivacyTip}
          arrow
        >
          <div>
            <BsQuestionCircleFill className="text-14 opacity-60 ml-1" />
          </div>
        </Tooltip>
      </div>
      <div className="mt-3 text-gray-800">
        <TextField
          value={state.amount}
          placeholder={lang.amount}
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
          onKeyPress={(e: any) => e.key === 'Enter' && pay()}
          InputProps={{
            endAdornment: <InputAdornment position="end">{state.selectedCurrency}</InputAdornment>,
            inputProps: { maxLength: 8, type: 'text' },
          }}
        />
        <div className="-mt-2" />
        <TextField
          value={state.memo}
          placeholder={`${lang.tipNote}（${lang.optional}）`}
          onChange={(event: any) => { state.memo = event.target.value; }}
          margin="normal"
          variant="outlined"
          fullWidth
          onKeyPress={(e: any) => e.key === 'Enter' && pay()}
          inputProps={{ maxLength: 20 }}
        />
      </div>
      <div className="text-center mt-6" onClick={() => pay()}>
        <Button>{lang.next}</Button>
      </div>
      <div
        className="mt-4 text-sm md:text-xs text-gray-400 cursor-pointer"
        onClick={() => {
          state.selectedCurrency = '';
          state.amount = '';
          state.step = 1;
        }}
      >
        {lang.selectOtherToken}
      </div>
    </div>
  );

  const step3 = () => (
    <div className="px-10">
      <div className="text-lg font-bold text-gray-700">
        {lang.mixinPay}
      </div>
      <div className="w-64 h-64 relative overflow-hidden">
        {state.paymentUrl && (
          <div
            className={classNames(
              {
                hidden: state.iframeLoading,
              },
              'w-64 h-64',
            )}
          >
            <iframe
              onLoad={() => {
                setTimeout(() => {
                  state.iframeLoading = false;
                }, 2000);
              }}
              title='Mixin'
              src={state.paymentUrl}
            />
            <style jsx>{`
              iframe {
                height: 506px;
                width: 800px;
                position: absolute;
                top: -238px;
                left: 0;
                margin-left: ${isWindow ? '-265px' : '-272px'};
                transform: scale(0.9);
              }
            `}</style>
          </div>
        )}
        {state.iframeLoading && (
          <div className="mt-24 pt-4">
            <Loading size={26} />
          </div>
        )}
      </div>
      <div className="mt-3 text-gray-600 opacity-80 leading-relaxed">
        {lang.scanQrCodeByMixin}
        <br />
        {lang.willRefreshAfterPayment}
        <br />
      </div>
      <div className="flex justify-center items-center mt-4 text-gray-500 text-xs opacity-80">
        <span className="flex items-center text-lg mr-1">
          <MdInfo />
        </span>
        {lang.noMixinOnYourPhone}
        <a
          className="text-gray-700 ml-1"
          href="https://mixin.one/messenger"
          target="_blank"
          rel="noopener noreferrer"
        >
          {lang.toDownload}
        </a>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-0 text-center pt-8 pb-6 px-10">
      { state.step === 1 && step1()}
      { state.step === 2 && step2()}
      { state.step === 3 && step3()}
    </div>
  );
});
