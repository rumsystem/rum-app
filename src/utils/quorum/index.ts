import { sendRequest } from './request';

import sleep from 'utils/sleep';

export interface ProcessStatus {
  up: boolean
  bootstrapId: string
  storagePath: string
  port: number
  logs: string
  quorumUpdating: boolean
}

export const getStatus = () =>
  sendRequest<ProcessStatus>({
    action: 'status',
  });

export interface UpParam {
  host: string
  bootstrapId: string
  storagePath: string
  pwd: string
}

export const up = (param: UpParam) =>
  sendRequest<ProcessStatus>({
    action: 'up',
    param,
  });

export const down = async () => {
  sendRequest<ProcessStatus>({
    action: 'down',
  });
  await sleep(4000);
};

export const setCert = async (cert: string) => {
  sendRequest<ProcessStatus>({
    action: 'set_cert',
    param: {
      cert,
    },
  });
  await sleep(4000);
};
