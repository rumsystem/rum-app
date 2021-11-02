require('./main/log');
require('@electron/remote/main').initialize();
const { app, BrowserWindow, ipcMain } = require('electron');
const ElectronStore = require('electron-store');
const { initQuorum, state: quorumState } = require('./main/quorum');
const { handleUpdate } = require('./main/updater');
const MenuBuilder = require('./main/menu');

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = !isDevelopment;

ElectronStore.initRenderer();

const sleep = (duration) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });

async function createWindow() {
  if (isDevelopment) {
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
    // wait 3 second for webpack to be up
    await sleep(3000);
  }

  const win = new BrowserWindow({
    width: 1280,
    height: 780,
    minWidth: 768,
    minHeight: 780,
    webPreferences: {
      contextIsolation: false,
      enableRemoteModule: true,
      nodeIntegration: true,
      webSecurity: !isDevelopment,
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
    if (app.quitPrompt) {
      e.preventDefault();
      win.webContents.send('main-before-quit');
    }
  });

  if (isProduction) {
    (async () => {
      await sleep(3000);
      handleUpdate(win);
    })();
  }
}

ipcMain.on('renderer-quit-prompt', () => {
  app.quitPrompt = true;
});

ipcMain.on('renderer-will-quit', () => {
  app.quitPrompt = false;
});

ipcMain.on('renderer-quit', () => {
  app.quit();
});

app.whenReady().then(async () => {
  if (isDevelopment) {
    console.log('Starting main process...');
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
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
