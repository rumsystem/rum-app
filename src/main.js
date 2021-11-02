require('./main/log');
require('@electron/remote/main').initialize();
const { app, BrowserWindow, ipcMain, Menu, Tray } = require('electron');
const ElectronStore = require('electron-store');
const { initQuorum, state: quorumState } = require('./main/quorum');
const { handleUpdate } = require('./main/updater');
const MenuBuilder = require('./main/menu');
const path = require('path');

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = !isDevelopment;

ElectronStore.initRenderer();

const sleep = (duration) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });

let win = null;
async function createWindow() {
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
      if (process.platform === 'darwin') {
        app.dock.hide();
      }
    }
  });

  if (isProduction) {
    (async () => {
      await sleep(3000);
      handleUpdate(win);
    })();
  }
}

let tray = null;
function createTray() {
  let icon = path.join(__dirname, '/../assets/icons/64x64@4x.png');
  if (process.platform === 'win32') {
    icon = path.join(__dirname, '/../assets/icon.ico');

  };
  tray = new Tray(icon);
  const showApp = () => {
    win.show();
    if (process.platform === 'darwin' && !app.dock.isVisible()) {
      app.dock.show();
    }
  };
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: showApp,
    },
    {
      label: 'Quit',
      click: () => {
        if (app.quitPrompt) {
          win.webContents.send('app-before-quit');
        } else {
          app.quit();
        }
      },
    },
  ]);
  tray.on('double-click', showApp);
  tray.setToolTip('Rum');
  tray.setContextMenu(contextMenu);
}

ipcMain.on('app-quit-prompt', () => {
  app.quitPrompt = true;
});

ipcMain.on('app-quit', () => {
  app.quit();
});

app.whenReady().then(async () => {
  if (isDevelopment) {
    console.log('Starting main process...');
  }
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    win.show();
    if (process.platform === 'darwin' && !app.dock.isVisible()) {
      app.dock.show();
    }
  }
});

app.on('before-quit', () => {
  app.quitting = true;
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
