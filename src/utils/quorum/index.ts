import { sendRequest } from './request';

import sleep from 'utils/sleep';

export interface ProcessStatus {
  up: boolean
  bootstrapId: string
  storagePath: string
  port: number
  cert: string
  quorumUpdating: boolean
}

export const getStatus = () =>
  sendRequest<ProcessStatus>({
    action: 'status',
  });

export const getLogs = () =>
  sendRequest<{ logs: string }>({
    action: 'logs',
  });

export interface UpParam {
  bootstrapHost: string
  bootstrapId: string
  storagePath: string
  password: string
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
  sendRequest({
    action: 'set_cert',
    param: {
      cert,
    },
  });
  await sleep(4000);
};
