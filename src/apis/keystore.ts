import request from '../request';
import getBase from 'utils/getBase';

export default {
  signTx(payload: {
    keyname: string
    nonce: number
    to: string
    value: string
    gas_limit: number
    gas_price: string
    data: string
    chain_id: string
  }) {
    return request('/api/v1/keystore/signtx ', {
      method: 'POST',
      base: getBase(),
      body: payload,
    });
  },
};
