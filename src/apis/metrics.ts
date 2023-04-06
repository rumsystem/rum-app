import request from '../request';
import getBase from 'utils/getBase';

export interface MetricItem {
  name: string
  help: string
  type: string
  metrics: Array<{
    value?: string
    buckets?: Record<string, string>
    count?: string
    sum?: string
    labels?: {
      action?: string
      version?: string
    }
    quantiles?: Record<string, string>
  }>
}

export type IMetrics = Array<MetricItem>;

export default {
  fetchMetrics() {
    return request('/metrics', {
      headers: { 'Content-Type': 'application/json' },
      method: 'GET',
      base: getBase(),
    }) as Promise<IMetrics>;
  },
};
