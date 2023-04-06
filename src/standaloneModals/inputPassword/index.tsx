import React from 'react';
import { createRoot } from 'react-dom/client';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { StoreProvider, useStore } from 'store';
import { Checkbox, Tooltip } from '@mui/material';
import { action } from 'mobx';
import { ThemeRoot } from 'utils/theme';
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
  const root = createRoot(div);
  const unmount = () => {
    root.unmount();
    div.remove();
  };
  root.render(
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
    </ThemeRoot>,
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
      transitionDuration={300}
    >
      <div className="w-100 bg-white text-center pt-12 pb-8 px-12">
        <div>
          <div className="text-16 font-bold text-gray-4a">{ props.check ? lang.enterNewPassword : lang.enterPassword }</div>
          <div className="w-60 mx-auto">
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
          </div>
          <Tooltip
            enterDelay={1000}
            enterNextDelay={1000}
            placement="top"
            title={lang.savePasswordTip}
            arrow
            disableInteractive
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
            <Button
              className="rounded w-[160px] h-10 whitespace-nowrap"
            >{lang.yes}</Button>
          </div>
          <div className="mt-3 text-13 text-link-blue text-center cursor-pointer" onClick={handleQuit}>
            {lang.cancel}
          </div>
        </div>
      </div>
    </Dialog>
  );
});
