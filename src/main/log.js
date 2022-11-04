const fs = require('fs');
const { ipcMain } = require('electron');
const log = require('electron-log');

// override console with electron-log
Object.assign(console, log.functions);

process.on('unhandledRejection', (reason) => {
  console.warn('unhandledRejection');
  console.warn(reason);
});

process.on('uncaughtException', (err) => {
  console.warn('uncaughtException');
  console.warn(err.message);
  console.warn(err.stack);

  process.exit(1);
});

ipcMain.on('get_main_log', async (event) => {
  const data = (await fs.promises.readFile(log.transports.file.getFile().path)).toString();
  event.sender.send('response_main_log', {
    data,
  });
});
