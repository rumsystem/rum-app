import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { ipcRenderer, shell } from 'electron';
import { useStore } from 'store';
import sleep from 'utils/sleep';
import Button from 'components/Button';
import { Tooltip } from '@mui/material';
import { isEmpty } from 'lodash';
import { lang } from 'utils/lang';
import useCloseNode from 'hooks/useCloseNode';

interface IVersionInfo {
  path: string
  releaseDate: string
  releaseNotes: string
  version: string
}

enum Step {
  UPDATE_AVAILABLE = 'UPDATE_AVAILABLE',
  UPDATE_DOWNLOADED = 'UPDATE_DOWNLOADED',
}

const message: Record<string, string> = {
  [Step.UPDATE_AVAILABLE]: 'checked new version, downloading ......',
  [Step.UPDATE_DOWNLOADED]: 'new version downloaded',
};

export default observer(() => {
  const state = useLocalObservable(() => ({
    versionInfo: {} as IVersionInfo,
    step: '',
  }));
  const { confirmDialogStore } = useStore();
  const closeNode = useCloseNode();

  const handleError = React.useCallback(() => {
    state.step = '';
    if (isEmpty(state.versionInfo)) {
      confirmDialogStore.show({
        content: lang.unableToUseAutoUpdate,
        okText: lang.gotIt,
        cancelDisabled: true,
        ok: () => {
          confirmDialogStore.hide();
        },
      });
    } else {
      confirmDialogStore.show({
        content: lang.unableToDownloadUpdate,
        okText: lang.download,
        cancelText: lang.updateNextTime,
        ok: () => {
          shell.openExternal(
            `https://storage.googleapis.com/static.press.one/rum-app/${state.versionInfo.path}`,
          );
          confirmDialogStore.hide();
        },
      });
    }
  }, [state]);

  const showUpdaterModal = React.useCallback(() => {
    confirmDialogStore.show({
      contentClassName: 'text-left',
      content: (
        <div className="min-w-[224px]">
          <div className="font-bold text-16">
            {lang.newVersion}
            {' '}
            {state.versionInfo.version} {lang.published}：
          </div>
          <div className="pl-2 pr-2 pt-2 text-13 leading-normal">
            {(state.versionInfo.releaseNotes || '').split(';').map((v, i) => (
              <div className="mt-2" key={i}>
                {v}
              </div>
            ))}
          </div>
        </div>
      ),
      okText: lang.reloadForUpdate,
      cancelText: lang.doItLater,
      ok: async () => {
        confirmDialogStore.setLoading(true);
        await closeNode();
        await sleep(1000);
        ipcRenderer.send('updater:quit-and-install');
        state.step = '';
        confirmDialogStore.hide();
      },
      cancel: () => {
        ipcRenderer.send('updater:quit-and-not-install', state.versionInfo.version);
        state.step = '';
        confirmDialogStore.hide();
      },
    });
  }, [state]);
  (window as any).showUpdaterModal = showUpdaterModal;

  React.useEffect(() => {
    ipcRenderer.on('updater:launchApp-check-error', (_event, error) => {
      console.log('fail to check for update');
      console.error(error);
      if (state.step === Step.UPDATE_AVAILABLE || state.step === Step.UPDATE_DOWNLOADED) {
        handleError();
      }
    });

    ipcRenderer.on('updater:manually-check-error', (_event, error) => {
      console.log('fail to check for update');
      console.error(error);
      handleError();
    });

    ipcRenderer.on('updater:update-not-available', () => {
      console.log('it\'s latest version');
      confirmDialogStore.show({
        content: lang.isLatestVersion + (isEmpty(state.versionInfo) ? '' : `(${state.versionInfo.version})`),
        okText: lang.gotIt,
        cancelDisabled: true,
        ok: () => {
          confirmDialogStore.hide();
        },
      });
    });

    ipcRenderer.on(
      'updater:update-available',
      (_event, versionInfo: IVersionInfo) => {
        state.step = Step.UPDATE_AVAILABLE;
        console.log(message[state.step]);
        console.log(versionInfo);
        state.versionInfo = versionInfo;
      },
    );

    ipcRenderer.on(
      'updater:update-downloaded',
      (_event, versionInfo: IVersionInfo) => {
        state.step = Step.UPDATE_DOWNLOADED;
        state.versionInfo = versionInfo;
        console.log(message[state.step]);
        console.log({ versionInfo });
        showUpdaterModal();
      },
    );
  }, []);

  if (state.step === Step.UPDATE_AVAILABLE) {
    return (
      <div className="fixed left-0 bottom-0 ml-12 mb-[40px] z-30">
        <Tooltip
          placement="right"
          title={lang.downloadingNewVersionTip}
          disableInteractive
        >
          <div>
            <Button isDoing size="small">
              {lang.downloadingNewVersion}
            </Button>
          </div>
        </Tooltip>
      </div>
    );
  }

  return null;
});
