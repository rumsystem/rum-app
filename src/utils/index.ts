import qs from 'query-string';

export { default as PrsAtm } from './prsAtm';

export { default as Finance } from './finance';

export { default as Block } from './block';

export { default as Log } from './log';

export { default as Producer } from './producer';

import moment from 'moment';

export const isDevelopment = process.env.NODE_ENV === 'development';

export const isProduction = !isDevelopment;

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

export const isWindow = window.navigator.userAgent.indexOf('Windows NT') != -1;

export const isWindow32 =
  window.navigator.userAgent.indexOf('Windows NT') != -1 &&
  window.navigator.userAgent.indexOf('WOW64') === -1 &&
  window.navigator.userAgent.indexOf('Win64') === -1;

export const ago = (timestamp: string) => {
  const now = new Date().getTime();
  const past = new Date(timestamp).getTime();
  const diffValue = now - past;
  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;
  const _week = diffValue / (7 * day);
  const _day = diffValue / day;
  const _hour = diffValue / hour;
  const _min = diffValue / minute;
  let result = '';
  const isLastYear =
    Number(moment().format('YYYY')) > Number(moment(timestamp).format('YYYY'));
  if (isLastYear && _week >= 15) {
    result = moment(timestamp).format('YYYY-MM-DD');
  } else if (_week >= 1) {
    result = moment(timestamp).format('MM-DD');
  } else if (_day >= 1) {
    result = Math.floor(_day) + '天前';
  } else if (_hour >= 1) {
    result = Math.floor(_hour) + '小时前';
  } else if (_min >= 1) {
    result = Math.floor(_min) + '分钟前';
  } else {
    result = '刚刚';
  }
  return result;
};
