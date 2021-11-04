require('./main/processLock');
require('./main/log');
const { app, BrowserWindow, ipcMain, Menu, Tray, dialog } = require('electron');
const ElectronStore = require('electron-store');
const { initQuorum, state: quorumState } = require('./main/quorum');
const { handleUpdate } = require('./main/updater');
const MenuBuilder = require('./main/menu');
const { sleep } = require('./main/utils');
const path = require('path');

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = !isDevelopment;

const store = new ElectronStore();

const main = () => {
  let win;
  ElectronStore.initRenderer();
  const createWindow = async () => {
    if (isDevelopment) {
      process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
      // wait 3 second for webpack to be up
      await sleep(3000);
    }

    win = new BrowserWindow({
      width: 1280,
      height: 780,
      minWidth: 768,
      minHeight: 780,
      webPreferences: {
        contextIsolation: false,
        enableRemoteModule: true,
        nodeIntegration: true,
        webSecurity: !isDevelopment,
        webviewTag: true,
      },
    });

    if (isDevelopment) {
      win.loadURL('http://localhost:1212/dist/index.html');
    } else {
      win.loadFile('dist/index.html');
    }

    const menuBuilder = new MenuBuilder(win);
    menuBuilder.buildMenu();

    win.on('close', async (e) => {
      if (app.quitting) {
        win = null;
      } else {
        e.preventDefault();
        win.hide();
        if (process.platform === 'win32') {
          const notice = !store.get('not-notice-when-close');
          if (notice) {
            try {
              const res = await dialog.showMessageBox({
                type: 'info',
                buttons: ['确定'],
                title: '窗口最小化',
                message: 'RUM将继续在后台运行, 可通过系统状态栏重新打开界面',
                checkboxLabel: '不再提示',
              });
              if (res?.checkboxChecked) {
                store.set('not-notice-when-close', true);
              }
            } catch {}
          }
        }
      }
    });

    if (isProduction) {
      sleep(3000).then(() => {
        handleUpdate(win);
      });
    }
  };

  let tray;
  function createTray() {
    const iconMap = {
      other: '../assets/icons/pc_bar_1024.png',
      win32: '../assets/icons/tray.ico',
    };
    const platform = process.platform === 'win32'
      ? 'win32'
      : 'other';
    const icon = path.join(__dirname, iconMap[platform]);

    tray = new Tray(icon);
    const showApp = () => {
      if (win) {
        win.show();
      }
    };
    const contextMenu = Menu.buildFromTemplate([
      {
        label: '显示主界面',
        click: showApp,
      },
      {
        label: '退出',
        click: () => {
          app.quit();
        },
      },
    ]);
    tray.on('click', showApp);
    tray.on('double-click', showApp);
    tray.setToolTip('Rum');
    tray.setContextMenu(contextMenu);
  }

  ipcMain.on('app-quit-prompt', () => {
    app.quitPrompt = true;
  });

  ipcMain.on('disable-app-quit-prompt', () => {
    app.quitPrompt = false;
  });


  ipcMain.on('app-version', (event) => {
    const version = app.getVersion();
    event.returnValue = version;
  });

  ipcMain.on('base-path', (event) => {
    const basePath = isProduction ? process.resourcesPath : `file://${app.getAppPath()}`;
    event.returnValue = basePath;
  });

  ipcMain.on('app-path', (event, arg) => {
    const appPath = app.getPath(arg);
    event.returnValue = appPath;
  });

  ipcMain.on('set-badge-count', (event, badgeCount) => {
    app.setBadgeCount(badgeCount);
  });

  ipcMain.handle('open-dialog', async (event, arg) => {
    const file = await dialog.showOpenDialog(win, arg);
    return file;
  });

  ipcMain.handle('save-dialog', async (event, arg) => {
    const file = await dialog.showSaveDialog(arg);
    return file;
  });

  ipcMain.handle('message-box', async (event, arg) => {
    const file = await dialog.showMessageBox(arg);
    return file;
  });

  app.on('render-process-gone', () => {
    app.quitPrompt = false;
  });

  app.on('before-quit', (e) => {
    if (app.quitPrompt) {
      e.preventDefault();
      win.webContents.send('app-before-quit');
    } else {
      app.quitting = true;
    }
  });

  ipcMain.on('app-quit', () => {
    app.quit();
  });

  app.on('window-all-closed', () => {});

  app.on('second-instance', () => {
    if (win) {
      if (!win.isVisible()) win.show();
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      win.show();
    }
  });

  app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    const serverCert = certificate.data.trim();
    const userInputCert = quorumState.userInputCert.trim();
    const distCert = quorumState.cert.trim();
    if ([userInputCert, distCert].includes(serverCert)) {
      event.preventDefault();
      callback(true);
      return;
    }
    callback(false);
  });

  try {
    initQuorum();
  } catch (err) {
    console.error('Quorum err: ');
    console.error(err);
  }

  app.whenReady().then(async () => {
    if (isDevelopment) {
      console.log('Starting main process...');
    }
    createWindow();
    if (process.platform !== 'darwin') {
      createTray();
    }
  });
};

if (app.hasSingleInstanceLock()) {
  main();
}
