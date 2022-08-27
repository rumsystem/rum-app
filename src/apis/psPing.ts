import request from '../request';
import getBase from 'utils/getBase';

export default {
  ping(peerId: string) {
    return request('/api/v1/psping', {
      method: 'POST',
      base: getBase(),
      body: {
        peer_id: peerId,
      },
    });
  },
};
