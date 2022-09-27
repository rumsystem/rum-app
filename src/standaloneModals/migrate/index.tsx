import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { lang } from 'utils/lang';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider } from 'store';
import { render, unmountComponentAtNode } from 'react-dom';
import { action } from 'mobx';
/* import {
 *   Switch,
 * } from '@material-ui/core'; */
import ElectronStore from 'electron-store';
import classNames from 'classnames';
import IconMigrateIn from 'assets/migrateIn.svg';
import IconMigrateOut from 'assets/migrateOut.svg';
import { exportKeyData } from 'standaloneModals/exportKeyData';
import { importKeyData } from 'standaloneModals/importKeyData';
import Button from 'components/Button';

const store = new ElectronStore({
  name: 'rum_app_update_version_status_store',
});

export const migrate = async () => new Promise<void>((rs) => {
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
          <Migrate
            rs={() => {
              rs();
              setTimeout(unmount, 3000);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
});


interface Props {
  rs: () => unknown
}

const Migrate = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    open: true,
    autoUpdate: !(store.get('disableAutoUpdate') === true || store.get('disableAutoUpdate') === 'true'),
    out: true,
  }));

  const handleClose = action(() => {
    state.open = false;
    props.rs();
  });

  React.useEffect(() => {
    (async () => {
    })();
  }, []);

  return (
    <Dialog
      className="group-info-modal"
      open={state.open}
      onClose={handleClose}
      transitionDuration={{
        enter: 300,
      }}
    >
      <div className="w-[720px] h-[460px] bg-white rounded-12 text-center px-8 pt-12 pb-8">
        <div className="px-6">
          <div className="text-22 font-medium text-gray-4a">
            {lang.migrate}
          </div>
          <div className="mt-7 flex items-center justify-center gap-x-[42px] text-18">
            <div
              className={classNames(
                'cursor-pointer',
                state.out && 'text-producer-blue',
              )}
              onClick={() => { state.out = true; }}
            >{lang.migrateOut}</div>
            <div
              className={classNames(
                'cursor-pointer',
                state.out || 'text-producer-blue',
              )}
              onClick={() => { state.out = false; }}
            >{lang.migrateIn}</div>
          </div>
          {state.out && (
            <div className="flex flex-col items-center justify-center mt-10">
              <img src={IconMigrateOut} alt={lang.migrateOut} />
              <Button
                className="h-10 px-4 py-2 rounded mt-8 border bg-gray-33 text-16 text-white"
                onClick={() => { exportKeyData('native'); }}
                disabled={!process.env.IS_ELECTRON}
              >{lang.saveBackupFile}</Button>
              <div className="mt-7 text-16 text-gray-9c">{lang.saveWasmBackupFileTip}</div>
              <div
                className="mt-3 cursor-pointer text-16 text-producer-blue"
                onClick={() => { exportKeyData('wasm'); }}
              >{lang.saveWasmBackupFile}</div>
            </div>
          )}
          {state.out || (
            <div className="flex flex-col items-center justify-center mt-10">
              <img src={IconMigrateIn} alt={lang.migrateIn} />
              <Button
                className="h-10 px-4 py-2 rounded mt-8 border bg-gray-33 text-16 text-white"
                onClick={() => { importKeyData(); }}
                disabled={!process.env.IS_ELECTRON}
              >{lang.saveBackupFile}</Button>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
});
