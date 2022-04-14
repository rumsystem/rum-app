import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { StoreProvider, useStore } from 'store';
import { Checkbox } from '@material-ui/core';
import { action } from 'mobx';
import { ThemeRoot } from 'utils/theme';
import Tooltip from '@material-ui/core/Tooltip';
import useCloseNode from 'hooks/useCloseNode';
import useResetNode from 'hooks/useResetNode';
import sleep from 'utils/sleep';
import { lang } from 'utils/lang';
import PasswordInput from 'components/PasswordInput';

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
    snackbarStore,
    modalStore,
  } = useStore();

  const closeNode = useCloseNode();
  const resetNode = useResetNode();

  const state = useLocalObservable(() => ({
    open: true,
    password: '',
    confirmPassword: '',
    remember: false,
  }));

  const handleSubmit = action(() => {
    if (!state.password) {
      snackbarStore.show({
        message: lang.require(lang.password),
        type: 'error',
      });
      return;
    }
    if (props.check && state.password !== state.confirmPassword) {
      snackbarStore.show({
        message: lang.passwordNotMatch,
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
    resetNode();
    await sleep(400);
    await closeNode();
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
      <div className="bg-white text-center py-8 pb-5 px-12">
        <div className="w-60">
          <div className="text-18 font-bold text-gray-700">{ props.check ? lang.enterNewPassword : lang.enterPassword }</div>
          <div className="pt-5">
            <PasswordInput
              className="w-full"
              placeholder={lang.password}
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
                <PasswordInput
                  className="w-full"
                  placeholder={lang.confirmPassword}
                  size="small"
                  value={state.confirmPassword}
                  onChange={action((e) => { state.confirmPassword = e.target.value; })}
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
            title={lang.savePasswordTip}
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
                {lang.savePassword}
              </span>
            </div>
          </Tooltip>
          <div className="mt-2" onClick={handleSubmit}>
            <Button fullWidth>{lang.yes}</Button>
          </div>
          <div className="mt-3 text-13 text-red-400 text-center cursor-pointer" onClick={handleQuit}>
            {lang.exitNode}
          </div>
        </div>
      </div>
    </Dialog>
  );
});
