import { sendRequest } from './request';

export * from './types';

import { ProcessStatus } from './types';

export const getStatus = () =>
  sendRequest<ProcessStatus>({
    action: 'status',
  });

export type UpParam =
  | {
      type: 'process';
      peername: string;
      bootstrapId: string;
    }
  | {
      type: 'forward';
      port: number;
    };

export const up = (param: UpParam) =>
  sendRequest<ProcessStatus>({
    action: 'up',
    param,
  });

export const down = () =>
  sendRequest<ProcessStatus>({
    action: 'down',
  });
