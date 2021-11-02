import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import Fade from '@material-ui/core/Fade';
import Dialog from 'components/Dialog';
import { MdInfo } from 'react-icons/md';
import classNames from 'classnames';
import Loading from 'components/Loading';
import Button from 'components/Button';
import { useStore } from 'store';
import { Finance, PrsAtm, isWindow } from 'utils';

interface IProps {
  step: number;
  setStep: (step: number) => void;
}

const Payment = observer((props: IProps) => {
  const { snackbarStore, modalStore } = useStore();
  const { step, setStep } = props;
  const {
    done,
    currency,
    title,
    useBalance,
    balanceAmount,
    balanceText,
    memoDisabled,
    pay,
    checkResult,
  } = modalStore.payment.props;
  const state = useLocalStore(() => ({
    amount: '',
    memo: '',
    paymentUrl: '',
    submitting: false,
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
          pass: (privateKey: string, accountName: string) => {
            (async () => {
              try {
                state.paymentUrl = await pay(
                  privateKey,
                  accountName,
                  state.amount,
                  state.memo
                );
                if (useBalance) {
                  done();
                  modalStore.payment.hide();
                  setStep(1);
                  return;
                }
                if (state.paymentUrl) {
                  state.iframeLoading = true;
                  setStep(2);
                }
                PrsAtm.polling(async () => {
                  try {
                    const isDone: boolean = await checkResult(
                      accountName,
                      state.amount
                    );
                    if (isDone) {
                      done();
                      modalStore.payment.hide();
                      setStep(1);
                    }
                    return isDone;
                  } catch (_err) {
                    return false;
                  }
                }, 1000);
              } catch (err) {
                console.log(err.message);
              }
              state.submitting = false;
            })();
          },
          cancel: () => {
            state.submitting = false;
          },
        });
      } else {
        snackbarStore.show(result);
      }
    })();
  }, []);

  React.useEffect(() => {
    return () => {
      PrsAtm.tryCancelPolling();
    };
  }, []);

  const Step1 = () => {
    return (
      <Fade in={true} timeout={500}>
        <div className="py-8 px-12 text-center">
          <div className="text-18 font-bold text-gray-700">{title}</div>
          <div>
            {memoDisabled && <div className="pt-1" />}
            <div className="mt-2 text-gray-800">
              <TextField
                value={state.amount}
                placeholder="数量"
                onChange={(e: any) => {
                  const { value } = e.target;
                  if (Finance.isValidAmount(value)) {
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
                }}
                helperText={
                  useBalance && `${balanceText || '余额'}：${balanceAmount}`
                }
              />
              {!memoDisabled && (
                <div>
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
              )}
            </div>
            <div className="mt-5">
              <Button
                onClick={() => tryPay()}
                fullWidth
                isDoing={state.submitting}
                disabled={
                  !state.amount ||
                  (useBalance &&
                    !Finance.largerEq(balanceAmount || '0', state.amount))
                }
              >
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
                    }, 1000);
                  }}
                  src={Finance.replaceMixinDomain(state.paymentUrl)}
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
              <div className="w-64 h-64 flex items-center justify-center">
                <Loading size={30} />
              </div>
            )}
          </div>
          <div
            className={classNames(
              {
                invisible: state.iframeLoading,
              },
              '-mt-3 text-gray-500 text-12 text-center'
            )}
          >
            <div>也可以点击 Mixin 收到的链接完成支付</div>
          </div>
          <div className="flex justify-center mt-5">
            <Button
              outline
              fullWidth
              className="mr-4"
              onClick={async () => {
                modalStore.payment.hide();
                setStep(1);
              }}
            >
              取消
            </Button>
            <Button
              fullWidth
              onClick={async () => {
                setStep(3);
              }}
            >
              我已支付
            </Button>
          </div>
          <div className="flex justify-center items-center mt-5 text-gray-500 text-12">
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
                你取消了支付？请
                <span
                  className="text-indigo-400 cursor-pointer"
                  onClick={() => {
                    setStep(2);
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
      {step === 1 && Step1()}
      {step === 2 && Step2()}
      {step === 3 && Step3()}
    </div>
  );
});

export default observer(() => {
  const { modalStore } = useStore();
  const { open } = modalStore.payment;
  const state = useLocalStore(() => ({
    step: 1,
  }));

  return (
    <Dialog
      hideCloseButton={state.step === 2}
      open={open}
      onClose={() => {
        modalStore.payment.hide();
        state.step = 1;
      }}
    >
      <div>
        <Payment step={state.step} setStep={(step) => (state.step = step)} />
      </div>
    </Dialog>
  );
});
