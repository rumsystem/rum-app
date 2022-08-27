import request from '../request';
import getBase from 'utils/getBase';

export interface BackupData {
  config: string
  keystore: string
  seeds: string
}

export default {
  backup() {
    return request('/api/v1/backup', {
      method: 'GET',
      base: getBase(),
      jwt: true,
    }) as Promise<BackupData>;
  },
};
