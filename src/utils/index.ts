import qs from 'query-string';

export { default as PrsAtm } from './prsAtm';

export { default as Finance } from './finance';

export { default as Block } from './block';

export const isDevelopment = process.env.REACT_APP_ENV === 'development';

export const isProduction = process.env.REACT_APP_ENV === 'production';

export const sleep = (duration: number) =>
  new Promise((resolve: any) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });

export const getPageElement = () =>
  document.querySelector('.layout-page') as HTMLElement;

export const getQuery = (name: string) => {
  return String(qs.parse(window.location.hash.split('?')[1])[name] || '');
};

export const setQuery = (param: any = {}) => {
  const parsed = {
    ...qs.parse(window.location.hash.split('?')[1]),
    ...param,
  };
  if (window.history.replaceState) {
    const newUrl =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      (window.location.hash.split('?')[0] || '') +
      `?${decodeURIComponent(qs.stringify(parsed))}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);
  }
};

export const removeQuery = (name: string) => {
  const parsed = qs.parse(window.location.hash.split('?')[1]);
  delete parsed[name];
  const isEmpty = Object.keys(parsed).length === 0;
  if (window.history.replaceState) {
    const newUrl =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      (window.location.hash.split('?')[0] || '') +
      `${isEmpty ? '' : '?' + decodeURIComponent(qs.stringify(parsed))}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);
  }
};
