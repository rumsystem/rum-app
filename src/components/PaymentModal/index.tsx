import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import Fade from '@material-ui/core/Fade';
import Dialog from '@material-ui/core/Dialog';
import { MdInfo } from 'react-icons/md';
import classNames from 'classnames';
import Loading from 'components/Loading';
import Button from 'components/Button';
import { useStore } from 'store';
import { Finance, PrsAtm } from 'utils';

const Payment = observer(() => {
  const { snackbarStore, modalStore, accountStore } = useStore();
  const { account } = accountStore;
  const { props } = modalStore.payment;
  const { done, currency } = props;
  const state = useLocalStore(() => ({
    step: 1,
    amount: '',
    memo: '',
    paymentUrl: '',
    submitting: false,
    directlyPaying: false,
    iframeLoading: false,
  }));

  const tryPay = React.useCallback(() => {
    (async () => {
      const result = Finance.checkAmount(state.amount, currency);
      if (result.ok) {
        if (state.submitting) {
          return;
        }
        state.submitting = true;
        modalStore.verification.show({
          pass: (privateKey: string) => {
            if (!privateKey) {
              state.submitting = false;
              if (state.directlyPaying) {
                modalStore.payment.hide();
              }
              return;
            }
            (async () => {
              try {
                if (state.directlyPaying) {
                  state.iframeLoading = true;
                }
                state.paymentUrl = await props.getPaymentUrl(
                  privateKey,
                  account.account_name,
                  state.amount,
                  state.memo
                );
                if (!state.directlyPaying) {
                  state.iframeLoading = true;
                  state.step = 2;
                }
                PrsAtm.polling(async () => {
                  try {
                    const isDone: boolean = await props.checkResult(
                      account.account_name,
                      state.amount
                    );
                    if (isDone) {
                      done();
                      modalStore.payment.hide();
                    }
                    return isDone;
                  } catch (_err) {
                    return false;
                  }
                }, 1000);
              } catch (err) {
                console.log(err);
              }
              state.submitting = false;
            })();
          },
        });
      } else {
        snackbarStore.show(result);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (props.amount) {
      state.step = 2;
      state.amount = props.amount;
      state.directlyPaying = true;
      tryPay();
    }
  }, [state, props.amount]);

  React.useEffect(() => {
    return () => {
      PrsAtm.tryCancelPolling();
    };
  }, []);

  const Step1 = () => {
    return (
      <Fade in={true} timeout={500}>
        <div className="py-8 px-12 text-center">
          <div className="text-18 font-bold text-gray-700">{props.title}</div>
          <div>
            <div className="mt-2 text-gray-800">
              <TextField
                value={state.amount}
                placeholder="数量"
                onChange={(event: any) => {
                  const re = /^[0-9]+[.]?[0-9]*$/;
                  const { value } = event.target;
                  if (value === '' || re.test(value)) {
                    state.amount = value;
                  }
                }}
                margin="normal"
                variant="outlined"
                fullWidth
                autoFocus
                onKeyPress={(e: any) => e.key === 'Enter' && tryPay()}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">{currency}</InputAdornment>
                  ),
                  inputProps: { maxLength: 8, type: 'text' },
                }}
              />
              <div className="-mt-2" />
              <TextField
                value={state.memo}
                placeholder="备注（可选）"
                onChange={(event: any) => (state.memo = event.target.value)}
                margin="normal"
                variant="outlined"
                fullWidth
                onKeyPress={(e: any) => e.key === 'Enter' && tryPay()}
                inputProps={{ maxLength: 20 }}
              />
            </div>
            <div className="mt-5" onClick={() => tryPay()}>
              <Button fullWidth isDoing={state.submitting}>
                确定
              </Button>
            </div>
          </div>
        </div>
      </Fade>
    );
  };

  const Step2 = () => {
    return (
      <Fade in={true} timeout={500}>
        <div className="py-8 px-12 text-center">
          <div className="text-18 font-bold text-gray-700">Mixin 扫码支付</div>
          <div className="relative overflow-hidden">
            {state.paymentUrl && (
              <div
                className={classNames(
                  {
                    hidden: state.iframeLoading,
                  },
                  'w-64 h-64'
                )}
              >
                <iframe
                  onLoad={() => {
                    setTimeout(() => {
                      state.iframeLoading = false;
                    }, 2000);
                  }}
                  src={state.paymentUrl}
                />
                <style jsx>{`
                  iframe {
                    height: 506px;
                    width: 800px;
                    position: absolute;
                    top: -238px;
                    left: 0;
                    margin-left: -272px;
                    transform: scale(0.9);
                  }
                `}</style>
              </div>
            )}
            {state.iframeLoading && (
              <div className="w-64 h-64 flex items-center justify-center">
                <Loading size={30} />
              </div>
            )}
          </div>
          <Button
            fullWidth
            className="mt-4"
            onClick={async () => {
              state.step = 3;
            }}
          >
            已支付？点击确认
          </Button>
          <div className="flex justify-center items-center mt-2 text-gray-500 text-12">
            <span className="flex items-center mr-1">
              <MdInfo className="text-16" />
            </span>
            手机还没有安装 Mixin ?
            <a
              className="text-indigo-400 ml-1"
              href="https://mixin.one/messenger"
              target="_blank"
              rel="noopener noreferrer"
            >
              前往下载
            </a>
          </div>
        </div>
      </Fade>
    );
  };

  const Step3 = () => {
    return (
      <Fade in={true} timeout={500}>
        <div className="p-8">
          <div className="w-64">
            <div className="text-gray-9b text-center">
              <div className="text-gray-700 font-bold text-18">
                Mixin 扫码支付
              </div>
              <div className="py-12 flex items-center justify-center">
                <Loading size={30} />
              </div>
              <div className="text-gray-9b text-center">
                请稍候，正在确认支付结果...
              </div>
              <div className="mt-2 text-xs text-gray-bd">
                您取消了支付？请
                <span
                  className="text-indigo-400 cursor-pointer"
                  onClick={() => {
                    state.step = 2;
                    state.iframeLoading = true;
                  }}
                >
                  返回
                </span>
                上一步
              </div>
            </div>
          </div>
        </div>
      </Fade>
    );
  };

  return (
    <div className="bg-white rounded-12 text-center">
      {state.step === 1 && Step1()}
      {state.step === 2 && Step2()}
      {state.step === 3 && Step3()}
    </div>
  );
});

export default observer(() => {
  const { modalStore } = useStore();
  const { open } = modalStore.payment;
  return (
    <Dialog open={open} onClose={() => modalStore.payment.hide()}>
      <div>
        <Payment />
      </div>
    </Dialog>
  );
});
