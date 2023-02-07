const path = require('path');
const electron = require('electron');

if (process.env.TEST_ENV) {
  electron.app.setPath(
    'userData',
    path.join(__dirname, '../tests/userData'),
  );
}
