import electron from 'electron';
import { testUserDataPath } from './constants';

if (process.env.TEST_ENV) {
  electron.app.setPath('userData', testUserDataPath);
}
