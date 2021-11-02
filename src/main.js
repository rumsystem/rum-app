require('./main/processLock');
require('./main/log');
require('@electron/remote/main').initialize();
const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron');
const ElectronStore = require('electron-store');
const { initQuorum, state: quorumState } = require('./main/quorum');
const { handleUpdate } = require('./main/updater');
const MenuBuilder = require('./main/menu');
const { sleep } = require('./main/utils');
const path = require('path');

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = !isDevelopment;

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
    let icon = path.join(__dirname, '/../assets/icons/Rum_forsmall_black.png');
    if (process.platform === 'win32') {
      icon = path.join(__dirname, '/../assets/icons/Rum_forsmall_black.ico');
    }
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

  app.on('second-instance', () => {
    if (win) {
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
