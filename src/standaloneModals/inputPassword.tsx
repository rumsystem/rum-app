import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { StoreProvider, useStore } from 'store';
import { TextField, Checkbox } from '@material-ui/core';
import { action } from 'mobx';
import { ThemeRoot } from 'utils/theme';
import Tooltip from '@material-ui/core/Tooltip';
import useExitNode from 'hooks/useExitNode';
import sleep from 'utils/sleep';

interface Response {
  password: string
  remember: boolean
}

export default async (props?: { force?: boolean, check?: boolean }) => new Promise<Response>((rs, rj) => {
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
            check={props && props.check}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
});


const InputPasswordModel = observer((props: { rs: (v: { password: string, remember: boolean }) => unknown, rj: (e: Error) => unknown, force?: boolean, check?: boolean }) => {
  const {
    nodeStore,
    snackbarStore,
    modalStore,
  } = useStore();

  const exitNode = useExitNode();

  const state = useLocalObservable(() => ({
    open: true,
    password: '',
    confrimPassword: '',
    remember: false,
  }));

  const handleSubmit = action(() => {
    if (!state.password) {
      snackbarStore.show({
        message: '请输入密码',
        type: 'error',
      });
      return;
    }
    if (props.check && state.password !== state.confrimPassword) {
      snackbarStore.show({
        message: '密码不一致',
        type: 'error',
      });
      return;
    }
    props.rs({ password: state.password, remember: state.remember });
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

  const handleQuit = action(async () => {
    modalStore.pageLoading.show();
    nodeStore.setStoragePath('');
    await sleep(400);
    await exitNode();
    await sleep(300);
    window.location.reload();
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
      <div className="bg-white rounded-12 text-center py-8 pb-5 px-12">
        <div className="w-60">
          <div className="text-18 font-bold text-gray-700">{ props.check ? '设置密码' : '输入密码' }</div>
          <div className="pt-5">
            <TextField
              className="w-full"
              placeholder="密码"
              size="small"
              value={state.password}
              onChange={action((e) => { state.password = e.target.value; })}
              onKeyDown={handleInputKeyDown}
              margin="dense"
              variant="outlined"
              type="password"
            />
          </div>
          {
            props.check && (
              <div className="pt-2">
                <TextField
                  className="w-full"
                  placeholder="确认密码"
                  size="small"
                  value={state.confrimPassword}
                  onChange={action((e) => { state.confrimPassword = e.target.value; })}
                  onKeyDown={handleInputKeyDown}
                  margin="dense"
                  variant="outlined"
                  type="password"
                />
              </div>
            )
          }
          <Tooltip
            enterDelay={1000}
            enterNextDelay={1000}
            placement="top"
            title="每次打开无需重复输入密码"
            arrow
          >
            <div
              className="flex items-center justify-center mt-4 -ml-2"
              onClick={() => {
                state.remember = !state.remember;
              }}
            >
              <Checkbox checked={state.remember} color="primary" />
              <span className="text-gray-88 text-13 cursor-pointer">
                记住密码
              </span>
            </div>
          </Tooltip>
          <div className="mt-2" onClick={handleSubmit}>
            <Button fullWidth>确定</Button>
          </div>
          <div className="mt-3 text-13 text-red-400 text-center cursor-pointer" onClick={handleQuit}>
            退出节点
          </div>
        </div>
      </div>
    </Dialog>
  );
});
