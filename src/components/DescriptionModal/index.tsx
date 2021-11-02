import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import TextField from '@material-ui/core/TextField';
import Fade from '@material-ui/core/Fade';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { useStore } from 'store';
import { Finance, PrsAtm } from 'utils';

const Description = observer(() => {
  const { snackbarStore, modalStore } = useStore();
  const { desc } = modalStore.description.props;
  const state = useLocalStore(() => ({
    description: desc,
    submitting: false,
  }));

  const submit = React.useCallback(() => {
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
                  modalStore.description.hide();
                  //setStep(1);
                  return;
                }
                if (state.paymentUrl) {
                  state.iframeLoading = true;
                  //setStep(2);
                }
                PrsAtm.polling(async () => {
                  try {
                    const isDone: boolean = await checkResult(
                      accountName,
                      state.amount
                    );
                    if (isDone) {
                      done();
                      modalStore.description.hide();
                      //setStep(1);
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

  return (
    <div className="bg-white rounded-12 text-center">
      <Fade in={true} timeout={500}>
        <div className="py-8 px-12 text-center">
          <div className="w-55">
            <div className="text-18 font-bold text-gray-700">编辑简介</div>
            <div>
              <div className="pt-3" />
              <TextField
                className="w-full"
                type="text"
                placeholder="简介"
                size="small"
                multiline
                rows={2}
                value={state.description}
                autoFocus={true}
                onChange={(e) => {
                  runInAction(() => {
                    state.description = e.target.value;
                  })
                }}
                onKeyDown={(e: any) => {
                  if (e.keyCode === 13) {
                    e.preventDefault();
                    e.target.blur();
                    submit();
                  }
                }}
                margin="dense"
                variant="outlined"
              />
              <div className="mt-5">
                <Button
                  onClick={() => submit()}
                  fullWidth
                  isDoing={state.submitting}
                >
                  确定
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Fade>
    </div>
  );
});

export default observer(() => {
  const { modalStore } = useStore();
  const { open } = modalStore.description;

  return (
    <Dialog
      open={open}
      onClose={() => {
        modalStore.description.hide();
      }}
    >
      <div>
        <Description />
      </div>
    </Dialog>
  );
});
