const { app, BrowserWindow, ipcMain } = require('electron')
const isDevelopment = process.env.NODE_ENV === 'development';

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
      console.log({ args });
      const resp = await action(...args);
      event.sender.send(callbackEventName, resp);
    } catch (err) {
      console.log(err);
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
    width: 1080,
    minWidth: 680,
    height: 840,
    webPreferences: {
      enableRemoteModule: true,
      nodeIntegration: true
    }
  })

  win.loadFile(isDevelopment ? './src/index.html' : 'index.html')
}

app.whenReady().then(createWindow)

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
