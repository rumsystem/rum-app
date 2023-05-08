export * from './PollingTask';
export * from './runLoading';
export * from './lang';
export { default as isV2Seed } from './isV2Seed';
export { default as sleep } from './sleep';
export { default as base64 } from './base64';
export { default as ago } from './ago';
export { replaceSeedAsButton } from './replaceSeedAsButton';

export const notNullFilter = <T>(v: T | undefined | null): v is T => v !== undefined && v !== null;
