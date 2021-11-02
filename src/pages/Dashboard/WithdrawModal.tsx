import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import TextField from '@material-ui/core/TextField';
import InputAdornment from '@material-ui/core/InputAdornment';
import Tooltip from '@material-ui/core/Tooltip';
import Dialog from '@material-ui/core/Dialog';
import { MdHelp } from 'react-icons/md';
import Button from 'components/Button';
import { useStore } from 'store';
import { Finance, PrsAtm, sleep } from 'utils';

interface IProps {
  currency: string;
  open: boolean;
  onClose: (done?: boolean) => void;
}

const Withdraw = observer((props: IProps) => {
  const { snackbarStore, modalStore, walletStore, accountStore } = useStore();
  const { onClose, currency } = props;
  const state = useLocalStore(() => ({
    amount: '',
    memo: '',
    loading: false,
    done: false,
  }));

  React.useEffect(() => {
    return () => {
      PrsAtm.tryCancelPolling();
    };
  }, []);

  const tryWithdraw = async () => {
    const result = Finance.checkAmount(
      state.amount,
      currency,
      walletStore.balance
    );
    if (result.ok) {
      if (state.loading) {
        return;
      }
      state.loading = true;
      state.done = false;
      modalStore.verification.show({
        pass: async (privateKey: string, accountName: string) => {
          if (!privateKey) {
            state.loading = false;
            return;
          }
          try {
            await PrsAtm.fetch({
              id: 'deposit',
              actions: ['atm', 'withdraw'],
              args: [
                privateKey,
                accountName,
                null,
                state.amount,
                state.memo || Finance.defaultMemo.WITHDRAW,
              ],
            });
            await sleep(1000);
            const balance: any = await PrsAtm.fetch({
              id: 'getBalance',
              actions: ['account', 'getBalance'],
              args: [accountName],
            });
            state.loading = false;
            state.done = true;
            await sleep(500);
            onClose(true);
            walletStore.setBalance(balance);
          } catch (err) {
            console.log(err);
            state.loading = false;
          }
        },
      });
    } else {
      snackbarStore.show(result);
    }
  };

  return (
    <div className="bg-white rounded-12 text-center">
      <div className="py-8 px-12 text-center">
        <div className="flex items-center justify-center">
          <div className="text-18 font-bold text-gray-700">
            转给{' '}
            <span className="font-bold mr-1">
              {accountStore.account.bound_mixin_profile.full_name}
            </span>
          </div>{' '}
          <Tooltip
            placement="top"
            title={`你当前绑定的 Mixin 账号，Mixin ID 是 ${accountStore.account.bound_mixin_profile.identity_number}`}
          >
            <div>
              <MdHelp className="text-gray-600 text-16" />
            </div>
          </Tooltip>
        </div>
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
              onKeyPress={(e: any) => e.key === 'Enter' && tryWithdraw()}
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
              onKeyPress={(e: any) => e.key === 'Enter' && tryWithdraw()}
              inputProps={{ maxLength: 20 }}
            />
          </div>
          <div className="mt-5" onClick={() => tryWithdraw()}>
            <Button fullWidth isDoing={state.loading} isDone={state.done}>
              确定
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default observer((props: IProps) => {
  const { open, onClose } = props;
  return (
    <Dialog open={open} onClose={() => onClose()}>
      <div>
        <Withdraw {...props} />
      </div>
    </Dialog>
  );
});
