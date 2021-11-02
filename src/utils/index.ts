export { default as PrsAtm } from './prsAtm';

export const isDevelopment = process.env.REACT_APP_ENV === 'development';

export const isProduction = process.env.REACT_APP_ENV === 'production';

export const sleep = (duration: number) =>
  new Promise((resolve: any) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });
