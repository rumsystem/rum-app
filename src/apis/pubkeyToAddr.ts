import request from '../request';
import getBase from 'utils/getBase';

export default {
  get(pubkey: string) {
    return request('/api/v1/tools/pubkeytoaddr', {
      method: 'POST',
      base: getBase(),
      body: {
        encoded_pubkey: pubkey,
      },
    });
  },
};
