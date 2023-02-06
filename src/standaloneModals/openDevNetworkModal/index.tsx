import path from 'path';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { isEqual } from 'lodash';
import fs from 'fs-extra';
import TOML from '@iarna/toml';
import { ipcRenderer } from 'electron';
import { Switch, Fade } from '@mui/material';
import { StoreProvider, useStore } from 'store';
import LabIcon from 'assets/icon_lab.svg';
import Button from 'components/Button';
import Dialog from 'components/Dialog';
import { ThemeRoot } from 'utils/theme';
import { lang } from 'utils/lang';
import sleep from 'utils/sleep';
import { replaceSeedAsButton } from 'utils/replaceSeedAsButton';
import { DEV_NETWORK_BOOTSTRAPS, BOOTSTRAPS } from 'utils/constant';

export default () => {
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
        <DevNetworkModal
          rs={() => {
            setTimeout(unmount, 3000);
          }}
        />
      </StoreProvider>
    </ThemeRoot>,
  );
};

const DevNetworkModal = observer((props: any) => {
  const { nodeStore } = useStore();
  const state = useLocalObservable(() => ({
    open: true,
    tomlObj: {} as any,
    prevTomlObj: {} as any,
    get reloadRequired() {
      return !isEqual(state.prevTomlObj, state.tomlObj) || state.changedDebugQuorum;
    },
    debugQuorum: localStorage.getItem(`d${nodeStore.storagePath}`) === 'y',
    changedDebugQuorum: false,
  }));
  const bugReportSeedButtonRef = React.useRef<HTMLDivElement>(null);

  const handleClose = () => {
    state.open = false;
    props.rs();
  };

  React.useEffect(() => {
    (async () => {
      try {
        const toml = await fs.readFile(
          path.join(nodeStore.storagePath, 'peerConfig', 'peer_options.toml'),
          'utf8',
        );
        state.tomlObj = TOML.parse(toml);
        state.prevTomlObj = TOML.parse(toml);
      } catch (err) {
        console.log(err);
      }
    })();
  }, []);

  React.useEffect(() => {
    setTimeout(() => {
      if (bugReportSeedButtonRef.current) {
        replaceSeedAsButton(bugReportSeedButtonRef.current);
      }
    }, 1);
  }, []);

  const saveTomlObj = async (tomlObj: any) => {
    try {
      await fs.writeFile(
        path.join(nodeStore.storagePath, 'peerConfig', 'peer_options.toml'),
        TOML.stringify(tomlObj),
      );
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Dialog
      open={state.open}
      onClose={() => {
        handleClose();
      }}
      hideCloseButton
      transitionDuration={300}
    >
      <div className="bg-gray-33 rounded-0 py-10">
        <div className="w-140 text-gray-9c px-12 pt-2 max-h-[80vh]">
          <div className="leading-relaxed text-12">
            <div className="flex">
              <img
                className="w-22"
                src={LabIcon}
                alt='lab'
              />
              <div className="ml-5">
                <div className="text-18 font-bold text-blue-400">{lang.rumLab}</div>
                <div className="mt-1">
                  {lang.labTip1}
                  <br />
                  {lang.labTip2}
                  <br />
                  {lang.labTip3}
                </div>
              </div>
            </div>
          </div>
          <div className="pt-5 border-b border-gray-6d" />
          <Fade in={true} timeout={300}>
            <div className="pb-5">
              <div className="flex justify-between gap-x-12 items-center rounded mt-3 py-2 px-4 relative">
                <div>
                  <div className="text-white font-bold">Dev Network</div>
                  <div className="mt-1 text-gray-99 text-12">{lang.useTestNet}</div>
                </div>
                <Switch
                  checked={!!state.tomlObj.enabledevnetwork}
                  color='primary'
                  onClick={() => {
                    state.tomlObj.enabledevnetwork = !state.tomlObj.enabledevnetwork;
                    state.tomlObj.bootstraps = (state.tomlObj.enabledevnetwork ? DEV_NETWORK_BOOTSTRAPS : BOOTSTRAPS).join(',');
                    saveTomlObj(state.tomlObj);
                  }}
                />
                {state.prevTomlObj.enabledevnetwork !== state.tomlObj.enabledevnetwork && (
                  <div className="text-red-400 text-12 right-2 bottom-[-3px] absolute transform scale-90 opacity-90">
                    {lang.requireRelaunch}
                  </div>
                )}
              </div>

              <div className="pt-5 border-b border-gray-6d" />
            </div>
          </Fade>
          {state.reloadRequired && (
            <div className="flex flex-center pb-1">
              <Button
                color='red'
                outline
                onClick={async () => {
                  handleClose();
                  await sleep(300);
                  ipcRenderer.send('relaunch');
                  ipcRenderer.send('quit');
                }}
              >
                {lang.relaunch}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  );
});
