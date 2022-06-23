const { app } = require('electron');

const hasLock = app.requestSingleInstanceLock();

if (!hasLock) {
  app.quit();
}
