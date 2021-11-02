const log = require('electron-log');
const { autoUpdater } = require('electron-updater');
const { ipcMain } = require('electron')

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

const getIsWindow32 = mainWindow => {
  try {
    const userAgent = mainWindow.webContents.userAgent || '';
    return navigator.userAgent.indexOf('Windows NT') != -1 && navigator.userAgent.indexOf("WOW64") === -1 && navigator.userAgent.indexOf("Win64") === -1;
  } catch (err) {
    log.error(err);
    return false;
  }
};

const handleUpdate = (mainWindow) => {
  try {
    // 检查更新出错
    autoUpdater.on('error', () => {
      log.info('error');
      mainWindow.webContents.send('updater:error');
    })

    // 检查是否有版本更新
    autoUpdater.on('checking-for-update', () => {
      log.info('checking-for-update');
      mainWindow.webContents.send('updater:checking-for-update');
    })

    // 检测到有版本更新
    autoUpdater.on('update-available', (versionInfo) => {
      log.info('update-available');
      log.info(versionInfo);
      mainWindow.webContents.send('updater:update-available', versionInfo);
    })

    // 未发现有新版本
    autoUpdater.on('update-not-available', () => {
      log.info('update-not-available');
      mainWindow.webContents.send('updater:update-not-available');
    })

    // 下载完成，引导用户重启
    autoUpdater.on('update-downloaded', versionInfo => {
      log.info('update-downloaded');
      log.info(versionInfo);
      mainWindow.webContents.send('updater:update-downloaded', versionInfo)
    })

    ipcMain.on('updater:quit-and-install', () => {
      log.info('updater:quit-and-install');
      autoUpdater.quitAndInstall();
    });

    if (getIsWindow32(mainWindow)) {
      autoUpdater.autoDownload = false;
    }
    autoUpdater.checkForUpdates();
  } catch (err) {
    log.error(err);
  }
}

module.exports = {
  handleUpdate
}
