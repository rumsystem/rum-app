import React from 'react';
import { unmountComponentAtNode, render } from 'react-dom';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import Transactions from './transactions';

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
    asset: '',
    open: true,
    publisher: '',
  }));

  const handleClose = action(() => {
    props.rs();
    state.open = false;
  });

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
        <div>
          <div className="text-20 font-bold text-gray-4a">交易记录</div>
          <div className="mt-5">
            <Transactions />
          </div>
        </div>
      </div>
    </Dialog>
  );
});
