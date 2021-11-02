import { sendRequest } from './request';

import { sleep } from 'utils';

export interface ProcessStatus {
  up: boolean;
  bootstrapId: string;
  storagePath: string;
  port: number;
  logs: string;
}

export const getStatus = () =>
  sendRequest<ProcessStatus>({
    action: 'status',
  });

export type UpParam = {
  host: string;
  bootstrapId: string;
  storagePath: string;
};

export const up = (param: UpParam) =>
  sendRequest<ProcessStatus>({
    action: 'up',
    param,
  });

export const down = async () => {
  sendRequest<ProcessStatus>({
    action: 'down',
  });
  await sleep(6000);
};
