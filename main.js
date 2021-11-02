const { app, BrowserWindow, ipcMain, dialog } = require('electron');

const log = require('electron-log');

const isDevelopment = process.env.NODE_ENV === 'development';

const { initQuorum } = require(isDevelopment ? './src/quorum' : './quorum');

const isProduction = !isDevelopment;

const { handleUpdate } = require(isDevelopment ? './src/updater' : './updater');

const MenuBuilder = require(isDevelopment ? './src/menu' : './menu');

const fs = require('fs');

const sleep = (duration) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });

async function createWindow () {
  // wait for webpack compile
  if (isDevelopment) {
    while (true) {
      try {
        await fs.promises.stat('.erb/dev_dist/index.html');
        break;
      } catch (e) {
        await sleep(1000)
      }
    }
  }

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 768,
    minHeight: 800,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true
    }
  })

  win.loadFile(isDevelopment ? '.erb/dev_dist/index.html' : 'dist/index.html')

  const menuBuilder = new MenuBuilder(win);
  menuBuilder.buildMenu();

  win.on('close', async e => {
    if (app.quitPrompt) {
      e.preventDefault();
      win.webContents.send('main-before-quit');
    }
  })

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
    console.log('Starting main process...')
    await sleep(5000);
  }
  createWindow();
});

app.on('window-all-closed', (e) => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

try {
  initQuorum()
} catch (err) {
  console.log('Quorum: ', err);
}
