import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { ipcRenderer } from 'electron';
import { useStore } from 'store';
import { isWindow32, sleep } from 'utils';
import Button from 'components/Button';
import Tooltip from '@material-ui/core/Tooltip';
import { isEmpty } from 'lodash';
import { shell } from 'electron';

interface IVersionInfo {
  path: string;
  releaseDate: string;
  releaseNotes: string;
  version: string;
}

enum Step {
  ERROR = 'ERROR',
  CHECKING_FOR_UPDATE = 'CHECKING_FOR_UPDATE',
  UPDATE_AVAILABLE = 'UPDATE_AVAILABLE',
  UPDATE_NOT_AVAILABLE = 'UPDATE_NOT_AVAILABLE',
  UPDATE_DOWNLOADED = 'UPDATE_DOWNLOADED',
}

const message: any = {
  [Step.ERROR]: '检查更新出错',
  [Step.CHECKING_FOR_UPDATE]: '正在检查更新......',
  [Step.UPDATE_AVAILABLE]: '检测到新版本，正在下载......',
  [Step.UPDATE_NOT_AVAILABLE]: '当前是最新版本',
  [Step.UPDATE_DOWNLOADED]: '新版本下载完毕',
};

export default observer(() => {
  const state = useLocalObservable(() => ({
    versionInfo: {} as IVersionInfo,
    showProgress: false,
    downloaded: false,
    showingUpdaterModal: false,
    refusedToUpdate: false,
    step: '',
  }));
  const { confirmDialogStore } = useStore();

  const handleError = React.useCallback(() => {
    state.showProgress = false;
    if (isEmpty(state.versionInfo)) {
      confirmDialogStore.show({
        content: '检查更新失败了，你可以联系工作人员下载最新版本',
        okText: '我知道了',
        cancelDisabled: true,
        ok: () => {
          confirmDialogStore.hide();
        },
      });
    } else {
      confirmDialogStore.show({
        content: '自动更新遇到了一点问题，请点击下载',
        okText: '下载',
        cancelText: '暂不更新',
        ok: () => {
          shell.openExternal(
            `https://static-assets.xue.cn/rum-testing/${state.versionInfo.path}`
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
        <div class="w-56">
          <div class="font-bold text-16 -mt-3 pr-5">新版本 ${
            state.versionInfo.version
          } 已发布：</div>
          <div class="pl-2 pt-4 text-13 leading-normal">${(
            state.versionInfo.releaseNotes || ''
          ).replaceAll(';', '<div class="mt-2" />')}</div>
        </div>
      `,
      okText: '更新',
      cancelText: '稍后',
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

  const showQuitAndInstallModal = React.useCallback(async () => {
    state.showProgress = false;
    confirmDialogStore.show({
      contentClassName: 'text-left',
      content: '新版本已下载，重启即可使用',
      okText: '重启',
      cancelText: '稍后',
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
      if (state.showProgress) {
        handleError();
      }
    });

    ipcRenderer.on('updater:checking-for-update', () => {
      state.step = Step.CHECKING_FOR_UPDATE;
      console.log(message[state.step]);
    });

    ipcRenderer.on(
      'updater:update-available',
      (_event, versionInfo: IVersionInfo) => {
        state.step = Step.UPDATE_AVAILABLE;
        console.log(message[state.step]);
        console.log(versionInfo);
        state.versionInfo = versionInfo;
        showUpdaterModal();
      }
    );

    ipcRenderer.on('updater:update-not-available', () => {
      state.step = Step.UPDATE_NOT_AVAILABLE;
      console.log(message[state.step]);
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
      }
    );

    ipcRenderer.on('check-for-updates-manually', () => {
      console.log('检查更新');
      console.log(state.step);

      if (state.step === Step.UPDATE_NOT_AVAILABLE) {
        confirmDialogStore.show({
          content: '当前已经是最新版本',
          okText: '我知道了',
          cancelDisabled: true,
          ok: () => {
            confirmDialogStore.hide();
          },
        });
        return;
      }

      if (isWindow32) {
        console.log('win32 不支持自动更新');
        if (isEmpty(state.versionInfo)) {
          confirmDialogStore.show({
            content: '32 位系统不支持自动更新，你可以联系工作人员下载最新版本',
            okText: '我知道了',
            cancelDisabled: true,
            ok: () => {
              confirmDialogStore.hide();
            },
          });
        } else {
          confirmDialogStore.show({
            content: '32 位系统不支持自动更新，你可以手动点击下载',
            okText: '下载',
            cancelText: '暂不更新',
            ok: () => {
              shell.openExternal(
                `https://static-assets.xue.cn/rum-testing/RUM-${state.versionInfo.version}-ia32.exe`
              );
              confirmDialogStore.hide();
            },
          });
        }
        return;
      }

      if (state.step === Step.ERROR) {
        handleError();
        return;
      }

      if (state.step === Step.UPDATE_AVAILABLE) {
        showUpdaterModal();
        return;
      }

      if (state.step === Step.UPDATE_DOWNLOADED) {
        showQuitAndInstallModal();
      }
    });
  }, []);

  if (!state.showProgress || state.step !== Step.UPDATE_AVAILABLE) {
    return null;
  }

  return (
    <div className="fixed left-0 bottom-0 ml-12 mb-[40px] z-30">
      <Tooltip
        placement="right"
        title="检测到新版本，正在为你下载，完成之后会提醒你重启安装"
      >
        <div>
          <Button isDoing size="small">
            正在下载新版本
          </Button>
        </div>
      </Tooltip>
    </div>
  );
});
