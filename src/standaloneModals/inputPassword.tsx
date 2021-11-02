import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { StoreProvider, useStore } from 'store';
import { TextField } from '@material-ui/core';
import { action } from 'mobx';
import { ThemeRoot } from 'utils/theme';

export default async (props?: { force: boolean }) => new Promise<string>((rs, rj) => {
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
          <InputPasswordModel
            rs={(v) => {
              rs(v);
              setTimeout(unmount, 3000);
            }}
            rj={(e) => {
              rj(e);
              setTimeout(unmount, 3000);
            }}
            force={props && props.force}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
});

const InputPasswordModel = observer((props: { rs: (v: string) => unknown, rj: (e: Error) => unknown, force?: boolean }) => {
  const { snackbarStore } = useStore();

  const state = useLocalObservable(() => ({
    open: true,
    pwd: '',
  }));

  const handleSubmit = action(() => {
    if (!state.pwd) {
      snackbarStore.show({
        message: '请输入密码',
        type: 'error',
      });
      return;
    }
    props.rs(state.pwd);
    state.open = false;
  });

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
      handleSubmit();
    }
  };

  const handleClose = action(() => {
    if (props.force) {
      return;
    }
    const e = new Error('closed');
    props.rj(e);
    state.open = false;
  });

  return (
    <Dialog
      disableEscapeKeyDown={props.force}
      hideCloseButton={props.force}
      open={state.open}
      onClose={handleClose}
      transitionDuration={{
        enter: 300,
      }}
    >
      <div className="bg-white rounded-12 text-center py-8 px-12">
        <div className="w-60">
          <div className="text-18 font-bold text-gray-700">输入密码</div>
          <div className="pt-5">
            <TextField
              className="w-full"
              placeholder="密码"
              size="small"
              value={state.pwd}
              onChange={action((e) => { state.pwd = e.target.value; })}
              onKeyDown={handleInputKeyDown}
              margin="dense"
              variant="outlined"
              type="password"
            />
          </div>
          <div className="mt-6" onClick={handleSubmit}>
            <Button fullWidth>确定</Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
});
