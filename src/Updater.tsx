import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { ipcRenderer, shell } from 'electron';
import { useStore } from 'store';
import sleep from 'utils/sleep';
import Button from 'components/Button';
import Tooltip from '@material-ui/core/Tooltip';
import { isEmpty } from 'lodash';
import { lang } from 'utils/lang';

interface IVersionInfo {
  path: string
  releaseDate: string
  releaseNotes: string
  version: string
}

enum Step {
  ERROR = 'ERROR',
  CHECKING_FOR_UPDATE = 'CHECKING_FOR_UPDATE',
  UPDATE_AVAILABLE = 'UPDATE_AVAILABLE',
  UPDATE_NOT_AVAILABLE = 'UPDATE_NOT_AVAILABLE',
  UPDATE_DOWNLOADED = 'UPDATE_DOWNLOADED',
}

const message: any = {
  [Step.ERROR]: 'fail to check for update',
  [Step.CHECKING_FOR_UPDATE]: 'check for update......',
  [Step.UPDATE_AVAILABLE]: 'checked new version, downloading ......',
  [Step.UPDATE_NOT_AVAILABLE]: 'it\'s latest version',
  [Step.UPDATE_DOWNLOADED]: 'new version downloaded',
};

export default observer(() => {
  const state = useLocalObservable(() => ({
    versionInfo: {} as IVersionInfo,
    showProgress: false,
    downloaded: false,
    showingUpdaterModal: false,
    refusedToUpdate: false,
    step: '',
    isManual: false,
  }));
  const { confirmDialogStore } = useStore();

  const handleError = React.useCallback(() => {
    state.showProgress = false;
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
            `https://static-assets.xue.cn/rum-testing/${state.versionInfo.path}`,
          );
          confirmDialogStore.hide();
        },
      });
    }
  }, [state]);

  const showUpdaterModal = React.useCallback(() => {
    state.showingUpdaterModal = true;
    confirmDialogStore.show({
      contentClassName: 'text-left',
      content: `
        <div class="min-w-[224px]">
          <div class="font-bold text-16 -mt-3 pr-5">${lang.newVersion} ${
  state.versionInfo.version
} ${lang.published}：</div>
          <div class="pl-2 pr-2 pt-4 text-13 leading-normal">${(
    state.versionInfo.releaseNotes || ''
  ).replaceAll(';', '<div class="mt-2" />')}</div>
        </div>
      `,
      okText: lang.update,
      cancelText: lang.doItLater,
      ok: async () => {
        confirmDialogStore.hide();
        state.showingUpdaterModal = false;
        await sleep(400);
        if (state.step === Step.ERROR) {
          handleError();
          return;
        }
        if (state.downloaded) {
          showQuitAndInstallModal();
        } else {
          state.showProgress = true;
        }
      },
      cancel: () => {
        state.refusedToUpdate = true;
        state.showingUpdaterModal = false;
        confirmDialogStore.hide();
      },
    });
  }, [state]);

  const showQuitAndInstallModal = React.useCallback(() => {
    state.showProgress = false;
    confirmDialogStore.show({
      contentClassName: 'text-left',
      content: lang.reloadAfterDownloaded,
      okText: lang.reload,
      cancelText: lang.doItLater,
      ok: async () => {
        confirmDialogStore.setLoading(true);
        await sleep(1000);
        ipcRenderer.send('updater:quit-and-install');
      },
    });
  }, [state]);

  React.useEffect(() => {
    ipcRenderer.on('updater:error', (_event, error) => {
      state.step = Step.ERROR;
      console.log(message[state.step]);
      console.error(error);
      if (state.showProgress || state.isManual) {
        handleError();
      }
    });

    ipcRenderer.on('updater:checking-for-update', () => {
      if (state.step) {
        state.isManual = true;
      }
      state.step = Step.CHECKING_FOR_UPDATE;
      console.log(message[state.step]);
    });

    ipcRenderer.on(
      'updater:update-available',
      async (_event, versionInfo: IVersionInfo) => {
        state.step = Step.UPDATE_AVAILABLE;
        console.log(message[state.step]);
        console.log(versionInfo);
        state.versionInfo = versionInfo;
        await sleep(2000);
        if (state.step === Step.ERROR) {
          if (state.showProgress || state.isManual) {
            handleError();
          }
        } else {
          showUpdaterModal();
        }
      },
    );

    ipcRenderer.on('updater:update-not-available', () => {
      state.step = Step.UPDATE_NOT_AVAILABLE;
      console.log(message[state.step]);
      if (state.isManual) {
        confirmDialogStore.show({
          content: lang.isLatestVersion,
          okText: lang.gotIt,
          cancelDisabled: true,
          ok: () => {
            confirmDialogStore.hide();
          },
        });
      }
    });

    ipcRenderer.on(
      'updater:update-downloaded',
      (_event, versionInfo: IVersionInfo) => {
        state.step = Step.UPDATE_DOWNLOADED;
        state.versionInfo = versionInfo;
        console.log(message[state.step]);
        console.log({ versionInfo });
        state.downloaded = true;
        if (!state.showingUpdaterModal && !state.refusedToUpdate) {
          showQuitAndInstallModal();
        }
      },
    );
  }, []);

  if (!state.showProgress || state.step !== Step.UPDATE_AVAILABLE) {
    return null;
  }

  return (
    <div className="fixed left-0 bottom-0 ml-12 mb-[40px] z-30">
      <Tooltip
        placement="right"
        title={lang.downloadingNewVersionTip}
      >
        <div>
          <Button isDoing size="small">
            {lang.downloadingNewVersion}
          </Button>
        </div>
      </Tooltip>
    </div>
  );
});
