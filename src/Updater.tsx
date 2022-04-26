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
    waitingDownloaded: false,
    downloaded: false,
    showingUpdaterModal: false,
    refusedToUpdate: false,
    step: '',
    isAuto: false,
  }));
  const { confirmDialogStore } = useStore();

  const handleError = React.useCallback(() => {
    if ((state.step === Step.CHECKING_FOR_UPDATE || state.step === Step.UPDATE_NOT_AVAILABLE) && state.isAuto) {
      state.isAuto = false; // error情况下复归
      return;
    }
    if (state.step === Step.UPDATE_AVAILABLE && !state.showingUpdaterModal && !state.waitingDownloaded) {
      return;
    }
    if (state.step === Step.UPDATE_DOWNLOADED && state.refusedToUpdate) {
      state.refusedToUpdate = false; // error情况下复归
      return;
    }
    state.showingUpdaterModal = false; // error情况下复归
    state.waitingDownloaded = false; // error情况下复归
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
      ok: () => {
        confirmDialogStore.hide();
        state.showingUpdaterModal = false; // 正常情况下复归
        if (state.downloaded) {
          showQuitAndInstallModal();
        } else {
          state.waitingDownloaded = true;
        }
      },
      cancel: () => {
        state.refusedToUpdate = true;
        state.showingUpdaterModal = false; // 正常情况下复归
        confirmDialogStore.hide();
      },
    });
  }, [state]);

  const showQuitAndInstallModal = React.useCallback(() => {
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
    ipcRenderer.on('updater:before-auto-update', () => {
      state.isAuto = true;
    });

    ipcRenderer.on('updater:error', (_event, error) => {
      console.log(message[Step.ERROR]);
      console.error(error);
      handleError();
    });

    ipcRenderer.on('updater:checking-for-update', () => {
      state.step = Step.CHECKING_FOR_UPDATE;
      console.log(message[state.step]);
    });

    ipcRenderer.on('updater:update-not-available', () => {
      state.step = Step.UPDATE_NOT_AVAILABLE;
      console.log(message[state.step]);
      if (state.isAuto) {
        state.isAuto = false; // 正常情况下复归
      } else {
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
      'updater:update-available',
      (_event, versionInfo: IVersionInfo) => {
        state.isAuto = false; // 正常情况下复归
        state.refusedToUpdate = false; // 正常情况下复归
        state.step = Step.UPDATE_AVAILABLE;
        console.log(message[state.step]);
        console.log(versionInfo);
        state.versionInfo = versionInfo;
        showUpdaterModal();
      },
    );

    ipcRenderer.on(
      'updater:update-downloaded',
      (_event, versionInfo: IVersionInfo) => {
        state.step = Step.UPDATE_DOWNLOADED;
        state.versionInfo = versionInfo;
        console.log(message[state.step]);
        console.log({ versionInfo });
        state.downloaded = true;
        if (!state.showingUpdaterModal && state.waitingDownloaded) {
          state.waitingDownloaded = false; // 正常情况下复归
          showQuitAndInstallModal();
        }
      },
    );
  }, []);

  if (state.waitingDownloaded && state.step === Step.UPDATE_AVAILABLE) {
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
  }

  return null;
});
