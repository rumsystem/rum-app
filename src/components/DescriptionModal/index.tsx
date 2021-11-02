import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import TextField from '@material-ui/core/TextField';
import Fade from '@material-ui/core/Fade';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { useStore } from 'store';
import { PrsAtm, sleep } from 'utils';

const Description = observer(() => {
  const {  modalStore, accountStore } = useStore();
  const { desc } = modalStore.description.props;
  const state = useLocalStore(() => ({
    description: desc,
    submitting: false,
    done: false,
  }));

  const submit = React.useCallback(async () => {
    if (state.submitting) {
      return;
    }
    console.log(accountStore.account.producer);
    runInAction(() => {
      state.submitting = true;
    });
    await sleep(200);
    modalStore.verification.show({
      pass: (privateKey: string, accountName: string) => {
        (async () => {
          try {
            const resp: any = await PrsAtm.fetch({
              actions: ['producer', 'register'],
              args: [
                accountName,
                state.description,
                accountStore.isProducer ? accountStore.account.producer.producer_key : '',
                accountStore.publicKey,
                privateKey,
              ],
              logging: true,
            });
            console.log({ resp });
            const account: any = await PrsAtm.fetch({
              actions: ['atm', 'getAccount'],
              args: [accountStore.account.account_name],
            });
            accountStore.setCurrentAccount(account);
            runInAction(() => {
              state.submitting = false;
              state.done = true;
            });
            modalStore.description.hide();
          } catch (err) {
            console.log(err.message);
          }
        })();
      },
      cancel: () => {
        runInAction(() => {
          state.submitting = false;
        });
      },
    });
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
                  isDone={state.done}
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
