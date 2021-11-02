const { app, BrowserWindow, ipcMain, dialog } = require('electron');

const log = require('electron-log');

const isDevelopment = process.env.NODE_ENV === 'development';

const { initQuorum } = require(isDevelopment ? './src/quorum' : './quorum');

const isProduction = !isDevelopment;

const { handleUpdate } = require(isDevelopment ? './src/updater' : './updater');

const MenuBuilder = require(isDevelopment ? './src/menu' : './menu');

const sleep = (duration) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });

function createWindow () {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true
    }
  })

  win.loadFile(isDevelopment ? './src/index.html' : 'index.html')

  const menuBuilder = new MenuBuilder(win);
  menuBuilder.buildMenu();

  win.on('close', async e => {
    if (app.skipPrompt) {
      return;
    }
    e.preventDefault();
    const res = await dialog.showMessageBox({
      type: 'question',
      buttons: ['确定', '取消'],
      title: '退出节点',
      message: '节点将会下线，确定退出吗？',
    });
    if (res.response === 0) {
      win.webContents.send('before-quit');
      app.skipPrompt = true;
    }
  })

  if (isProduction) {
    (async () => {
      await sleep(3000);
      handleUpdate(win);
    })();
  }
}

ipcMain.on('quit', () => {
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
