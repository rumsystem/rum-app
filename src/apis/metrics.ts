import request from '../request';
import getBase from 'utils/getBase';

export type IMetrics = Array<any>;

export default {
  fetchMetrics() {
    return request('/metrics', {
      headers: { 'Content-Type': 'application/json' },
      method: 'GET',
      base: getBase(),
    }) as Promise<IMetrics>;
  },
};
