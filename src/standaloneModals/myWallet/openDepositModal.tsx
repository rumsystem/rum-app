import React from 'react';
import { unmountComponentAtNode, render } from 'react-dom';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { TextField, FormControl, Select, MenuItem, InputLabel } from '@material-ui/core';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import { lang } from 'utils/lang';
import Transactions from './transactions';
import WalletApi, { ICoin } from 'apis/wallet';
import Loading from 'components/Loading';

export default () => {
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

const Deposit = observer((props: any) => {
  const state = useLocalObservable(() => ({
    fetched: false,
    asset: '',
    open: true,
    publisher: '',
    coins: [] as ICoin[],
  }));

  React.useEffect(() => {
    (async () => {
      try {
        const res = await WalletApi.coins();
        state.coins = Object.values(res.data);
      } catch (err) {
        console.log(err);
      }
      state.fetched = true;
    })();
  }, []);

  const handleClose = action(() => {
    props.rs();
    state.open = false;
  });

  const handleSubmit = () => {};

  return (
    <Dialog
      maxWidth={false}
      open={state.open}
      onClose={handleClose}
      transitionDuration={{
        enter: 300,
      }}
    >
      <div className="w-[780px] bg-white text-center py-8 px-12">
        {!state.fetched && (
          <div className="pt-40 flex justify-center">
            <Loading />
          </div>
        )}
        {state.fetched && (
          <div>
            <div className="text-20 font-bold text-gray-4a">充币</div>
            <div className="pt-8 w-60 mx-auto">
              <FormControl
                className="w-full text-left"
                size="small"
                variant="outlined"
              >
                <InputLabel>选择币种</InputLabel>
                <Select
                  value={state.asset}
                  label="选择币种"
                  onChange={action((e) => { state.asset = e.target.value as string; })}
                >
                  {state.coins.map((coin) => (
                    <MenuItem key={coin.id} value={coin.symbol} className="flex items-center leading-none">{coin.symbol}
                      <span className="ml-1 opacity-40 text-12">- {coin.name}</span>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                autoFocus
                className="w-full mt-5"
                placeholder="数量"
                size="small"
                value={state.publisher}
                onChange={action((e) => { state.publisher = e.target.value; })}
                margin="dense"
                variant="outlined"
              />
            </div>
            <div className="mt-6" onClick={handleSubmit}>
              <Button
                className="rounded h-10"
              >
                {lang.yes}
              </Button>
            </div>
            <div className="mt-10">
              <div className="text-16 py-3 text-left font-bold">
                充币记录
              </div>
              <Transactions />
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
});
