const log = require('electron-log');
const { autoUpdater } = require('electron-updater');
const { app, ipcMain } = require('electron');
const {
  app,
} = require('electron');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

const handleUpdate = (mainWindow) => {
  ipcMain.on('check-for-update-from-renderer', () => {
    autoUpdater.checkForUpdates();
    console.log('update');
  });

  try {
    // 检查更新出错
    autoUpdater.on('error', (error) => {
      log.info('error');
      mainWindow.webContents.send('updater:error', error);
    });

    // 检查是否有版本更新
    autoUpdater.on('checking-for-update', () => {
      log.info('checking-for-update');
      mainWindow.webContents.send('updater:checking-for-update');
    });

    // 检测到有版本更新
    autoUpdater.on('update-available', (versionInfo) => {
      log.info('update-available');
      log.info(versionInfo);
      mainWindow.webContents.send('updater:update-available', versionInfo);
    });

    // 未发现有新版本
    autoUpdater.on('update-not-available', () => {
      log.info('update-not-available');
      mainWindow.webContents.send('updater:update-not-available');
    });

    // 下载完成，引导用户重启
    autoUpdater.on('update-downloaded', (versionInfo) => {
      log.info('update-downloaded');
      log.info(versionInfo);
      mainWindow.webContents.send('updater:update-downloaded', versionInfo);
    });

    ipcMain.on('updater:quit-and-install', () => {
      app.quitting = true;
      app.quitPrompt = false;
      log.info('updater:quit-and-install');
      autoUpdater.quitAndInstall();
    });

    autoUpdater.checkForUpdates();
  } catch (err) {
    log.error(err);
  }
};

module.exports = {
  handleUpdate,
};
