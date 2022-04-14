require('./main/processLock');
require('./main/test');
require('./main/log');
const remoteMain = require('@electron/remote/main');
const { app, BrowserWindow, ipcMain, Menu, Tray, dialog, protocol } = require('electron');
const ElectronStore = require('electron-store');
const { initQuorum, state: quorumState } = require('./main/quorum');
const { handleUpdate } = require('./main/updater');
const MenuBuilder = require('./main/menu');
const { sleep } = require('./main/utils');
const path = require('path');

remoteMain.initialize();

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
      minHeight: 500,
      webPreferences: {
        contextIsolation: false,
        enableRemoteModule: true,
        nodeIntegration: true,
        webSecurity: !isDevelopment && !process.env.TEST_ENV,
        webviewTag: true,
      },
    });

    remoteMain.enable(win.webContents);

    if (process.env.TEST_ENV === 'prod') {
      win.loadFile('src/dist/index.html');
    } else if (isDevelopment || process.env.TEST_ENV === 'dev') {
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
      other: '../assets/icons/pc_bar_icon.png',
      win32: '../assets/icon.ico',
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

  app.on('second-instance', (event, commandLine, workingDirectory, additionalData) => {
    if (win) {
      if (!win.isVisible()) win.show();
      if (win.isMinimized()) win.restore();
      win.focus();
    }
    const firstArg = additionalData.at(0);
    if (!firstArg) {
      return;
    }
    if (firstArg.startsWith('rum-app://')) {
      win.webContents.send('rum-app', firstArg);
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
    const certValid = userInputCert
      ? userInputCert === serverCert
      : distCert === serverCert;
    if (certValid) {
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

  ipcMain.on('inspect-picker', () => {
    if (!win || !isDevelopment) {
      return;
    }
    if (win.webContents.isDevToolsOpened()) {
      win.devToolsWebContents.executeJavaScript('DevToolsAPI.enterInspectElementMode()');
    } else {
      win.webContents.once('devtools-opened', () => {
        win.devToolsWebContents.executeJavaScript('DevToolsAPI.enterInspectElementMode()');
      });
      win.openDevTools();
    }
  });

  app.whenReady().then(async () => {
    if (isDevelopment) {
      console.log('Starting main process...');
    }
    createWindow();
    if (process.platform !== 'darwin') {
      createTray();
    }

    const mainjs = path.join(__dirname, '..');
    const electronExe = process.execPath;
    if (isDevelopment) {
      app.setAsDefaultProtocolClient('rum-app', electronExe, [mainjs]);
    } else {
      app.setAsDefaultProtocolClient('rum-app');
    }
  });
};

if (app.hasSingleInstanceLock()) {
  main();
}
