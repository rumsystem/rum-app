import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { lang } from 'utils/lang';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider } from 'store';
import { render, unmountComponentAtNode } from 'react-dom';
import { action } from 'mobx';
import Banner from 'assets/logo_rumsystem_banner_yellow.svg';
import Link from 'assets/bx-link-external.svg';
import { app, shell } from '@electron/remote';
import {
  Switch,
} from '@material-ui/core';
import { ipcRenderer } from 'electron';

export const about = async () => new Promise<void>((rs) => {
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
          <About
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

const About = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    open: true,
    autoUpdate: true,
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
      <div className="bg-gray-33 rounded-0 p-8 pb-3 w-120">
        <div className="pt-2 px-6">
          <div className="flex pt-4 pb-8 item-center justify-center border-b border-gray-4a"><img className="w-55" src={Banner} /></div>
          <div className="pt-5 flex items-center">
            <span className="text-16 font-medium text-white">{lang.version}</span>
            <span className="text-14 text-white ml-3">{process.env.IS_ELECTRON ? 'v' + app.getVersion() : ''}</span>
            <span className="text text-producer-blue ml-8 cursor-pointer">{lang.checkForUpdate}</span>
          </div>
          <div className="pt-8 flex items-center justify-between">
            <div className="flex flex-col justify-center">
              <div
                className="text-16 font-medium text-white"
                onClick={() => {
                  if (!process.env.IS_ELECTRON) {
                    // TODO:
                    // eslint-disable-next-line no-alert
                    alert('TODO');
                    return;
                  }
                  ipcRenderer.send('check-for-update-from-renderer');
                }}
              >{lang.autoUpdate}</div>
              <div className="text-12 text-gray-6f">{ state.autoUpdate ? lang.enableAutoUpdate : lang.disableAutoUpdate}</div>
            </div>
            <div>
              <div className="text-16 font-medium text-white">
                <Switch
                  checked={state.autoUpdate}
                  color='primary'
                  onClick={() => { state.autoUpdate = !state.autoUpdate; }}
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
