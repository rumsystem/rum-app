const { app, BrowserWindow, ipcMain } = require('electron')

const isDevelopment = process.env.NODE_ENV === 'development';

const MenuBuilder = require(isDevelopment ? './src/menu' : 'menu');

const prsAtm = require(isDevelopment ? 'prs-atm' : './prs-atm.prod');
const prsAtmPackageJson = require(isDevelopment ? './node_modules/prs-atm/package.json' : './package.prs-atm.json');
prsAtm.getVersion = () => prsAtmPackageJson.version;

ipcMain.on('prs-atm', async (event, arg) => {
  try {
    const { actions = [], args = [], callbackEventName } = JSON.parse(arg);
    try {
      let action = prsAtm;
      for (const actionPart of actions) {
        action = action[actionPart];
      }
      const resp = await action(...args);
      event.sender.send(callbackEventName, resp);
    } catch (err) {
      console.log(err.message);
      event.sender.send(`prs-atm-${callbackEventName}-error`, err);
    }
  } catch (err) {
    if (err.status === 404) {
      return;
    }
    console.log(err);
  }
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
}

const sleep = (duration) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });

app.whenReady().then(async () => {
  if (isDevelopment) {
    console.log('Starting main process...')
    await sleep(5000);
  }
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
