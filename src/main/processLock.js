const { app } = require('electron');

const args = app.isPackaged
  ? process.argv.slice(1)
  : process.argv.slice(2);
const hasLock = app.requestSingleInstanceLock(args);

if (!hasLock) {
  app.quit();
}
