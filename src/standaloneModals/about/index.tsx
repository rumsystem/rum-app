import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { lang } from 'utils/lang';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider } from 'store';
import { createRoot } from 'react-dom/client';
import { action } from 'mobx';
import Banner from 'assets/logo_rumsystem_banner_yellow.svg';
import Link from 'assets/bx-link-external.svg';
import {
  Switch,
} from '@mui/material';
import { ipcRenderer, shell } from 'electron';
import ElectronStore from 'electron-store';

const store = new ElectronStore({
  name: 'rum_app_update_version_status_store',
});

export const about = async () => new Promise<void>((rs) => {
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
        <About
          rs={() => {
            rs();
            setTimeout(unmount, 3000);
          }}
        />
      </StoreProvider>
    </ThemeRoot>,
  );
});


interface Props {
  rs: () => unknown
}

const About = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    open: true,
    autoUpdate: !(store.get('disableAutoUpdate') === true || store.get('disableAutoUpdate') === 'true'),
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
      transitionDuration={300}
    >
      <div className="bg-gray-33 rounded-0 p-8 pb-3 w-120">
        <div className="pt-2 px-6">
          <div className="flex pt-4 pb-8 item-center justify-center border-b border-gray-4a"><img className="w-55" src={Banner} /></div>
          <div className="pt-5 flex items-center">
            <span className="text-16 font-medium text-white">{lang.version}</span>
            <span className="text-14 text-white ml-3">v{ipcRenderer.sendSync('app-version')}</span>
            <span
              className="text text-producer-blue ml-8 cursor-pointer"
              onClick={() => {
                ipcRenderer.send('check-for-update-from-renderer');
              }}
            >{lang.checkForUpdate}</span>
          </div>
          <div className="pt-8 flex items-center justify-between">
            <div className="flex flex-col justify-center">
              <div className="text-16 font-medium text-white">{lang.autoUpdate}</div>
              <div className="text-12 text-gray-6f">{ state.autoUpdate ? lang.enableAutoUpdate : lang.disableAutoUpdate}</div>
            </div>
            <div>
              <div className="text-16 font-medium text-white">
                <Switch
                  checked={state.autoUpdate}
                  color='primary'
                  onClick={() => {
                    store.set('disableAutoUpdate', state.autoUpdate);
                    state.autoUpdate = !state.autoUpdate;
                  }}
                />
              </div>
            </div>
          </div>
          <div className="pt-[100px] flex items-center justify-center">
            <span
              className="flex items-center justify-center text-12 text-producer-blue cursor-pointer"
              onClick={() => {
                shell.openExternal('https://rumsystem.net/');
              }}
            ><img className="" src={Link} />RumSystem</span>
            <span className="text-12 text-gray-6f">© 2021 ~ 2022, All rights reserved.</span>
          </div>
        </div>
      </div>
    </Dialog>
  );
});
