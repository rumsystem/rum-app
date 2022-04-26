/* eslint-disable @typescript-eslint/no-namespace */
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import { BrowserWindow, ipcMain } from 'electron';
import ElectronStore from 'electron-store';
import { appState } from './appState';

const store = new ElectronStore({
  name: 'rum_app_update_version_status_store',
});

autoUpdater.logger = log;
log.transports.file.level = 'info';

export const handleUpdate = (mainWindow: BrowserWindow) => {
  let updateType = '';
  let isUpdating = false;
  ipcMain.on('check-for-update-from-renderer', () => {
    updateType = 'manually';
    if (isUpdating) {
      return;
    }
    isUpdating = true;
    autoUpdater.checkForUpdates();
    log.info('manually update');
    console.log('manually update');
  });

  try {
    // 检查更新出错
    autoUpdater.on('error', (error) => {
      isUpdating = false;
      log.info('error');
      if (updateType === 'launchApp') {
        mainWindow.webContents.send('updater:launchApp-check-error', error);
      }
      if (updateType === 'manually') {
        mainWindow.webContents.send('updater:manually-check-error', error);
      }
    });

    // 检查是否有版本更新
    autoUpdater.on('checking-for-update', () => {
      log.info('checking-for-update');
    });

    // 未发现有新版本
    autoUpdater.on('update-not-available', () => {
      isUpdating = false;
      log.info('update-not-available');
      if (updateType === 'manually') {
        mainWindow.webContents.send('updater:update-not-available');
      }
    });

    // 检测到有版本更新
    autoUpdater.on('update-available', (versionInfo) => {
      const status = store.get(versionInfo.version);
      log.info('update-available');
      log.info(versionInfo);
      if (status === 'ignore' && updateType !== 'manually') {
        log.info('version-ignored');
        return;
      }
      if (updateType === 'auto') {
        return;
      }
      mainWindow.webContents.send('updater:update-available', versionInfo);
    });

    // 下载完成，引导用户重启
    autoUpdater.on('update-downloaded', (versionInfo) => {
      const status = store.get(versionInfo.version);
      if (status === 'ignore' && updateType !== 'manually') {
        isUpdating = false;
        return;
      }
      log.info('update-downloaded');
      log.info(versionInfo);
      mainWindow.webContents.send('updater:update-downloaded', versionInfo);
    });

    ipcMain.on('updater:quit-and-install', () => {
      isUpdating = false;
      appState.quitting = true;
      appState.quitPrompt = false;
      log.info('updater:quit-and-install');
      autoUpdater.quitAndInstall();
    });

    ipcMain.on('updater:quit-and-not-install', (_, version) => {
      isUpdating = false;
      log.info('updater:quit-and-not-install');
      if (version) {
        store.set(version, 'ignore');
      }
    });

    const autoUpdate = (launchApp?: boolean) => {
      if (isUpdating) {
        return;
      }
      updateType = launchApp ? 'launchApp' : 'auto';
      isUpdating = true;
      log.info(launchApp ? 'launchApp update' : 'auto update');
      autoUpdater.checkForUpdates();

      setTimeout(autoUpdate, 5 * 60 * 1000);
    };
    autoUpdate(true);
  } catch (err) {
    log.error(err);
  }
};
