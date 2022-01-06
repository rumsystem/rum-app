const log = require('electron-log');
const { autoUpdater } = require('electron-updater');
const { app, ipcMain } = require('electron');
const ElectronStore = require('electron-store');

const store = new ElectronStore({
  name: 'rum_app_update_version_status_store',
});

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

const handleUpdate = (mainWindow) => {
  let updateType = '';
  let isUpdating = false;
  ipcMain.on('check-for-update-from-renderer', () => {
    if (isUpdating) {
      return;
    }
    updateType = 'manually';
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
        return;
      }
      log.info('update-downloaded');
      log.info(versionInfo);
      mainWindow.webContents.send('updater:update-downloaded', versionInfo);
    });

    ipcMain.on('updater:quit-and-install', () => {
      isUpdating = false;
      app.quitting = true;
      app.quitPrompt = false;
      log.info('updater:quit-and-install');
      autoUpdater.quitAndInstall();
    });

    ipcMain.on('updater:quit-and-not-install', (version) => {
      isUpdating = false;
      log.info('updater:quit-and-not-install');
      if (version) {
        store.set(version, 'ignore');
      }
    });

    const autoUpdate = (launchApp) => {
      if (isUpdating) {
        return;
      }
      updateType = launchApp ? 'launchApp' : 'auto';
      isUpdating = true;
      log.info(launchApp ? 'launchApp update' : 'auto update');
      autoUpdater.checkForUpdates();
    };
    autoUpdate(true);
    setInterval(autoUpdate, 5 * 60 * 1000);
  } catch (err) {
    log.error(err);
  }
};

module.exports = {
  handleUpdate,
};
