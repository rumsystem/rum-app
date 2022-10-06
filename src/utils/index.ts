import qs from 'query-string';

import moment from 'moment';

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
  const isDiffDay = new Date().getDate() !== new Date(timestamp).getDate();
  if (isLastYear && _week >= 15) {
    result = moment(timestamp).format('YYYY-MM-DD HH:mm');
  } else if (_day >= 1 || isDiffDay) {
    result = moment(timestamp).format('MM-DD HH:mm');
  } else if (_hour >= 4) {
    result = moment(timestamp).format('HH:mm');
  } else if (_hour >= 1) {
    result = Math.floor(_hour) + '小时前';
  } else if (_min >= 1) {
    result = Math.floor(_min) + '分钟前';
  } else {
    result = '刚刚';
  }
  return result;
};

export const urlify = (text: string) => {
  if (!text) {
    return text;
  }
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, '<a class="text-blue-400" href="$1">$1</a>');
};

export const resizeImageByWidth = (
  width: number,
  img: HTMLImageElement,
  file: File
) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = (width * img.height) / img.width;
    context?.drawImage(img, 0, 0, width, (width * img.height) / img.width);
    canvas.toBlob(
      (blob: any) => {
        blob.lastModifiedDate = new Date();
        blob.name = file.name;
        resolve(blob);
      },
      file.type,
      1
    );
  });
};

export const limitImageWidth = (width: number, file: File) => {
  return new Promise((resolve, reject) => {
    const objectURL = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = (e: any) => {
      URL.revokeObjectURL(objectURL);
      e.msg = 'INVALID_IMG';
      reject(e);
    };
    img.onload = async () => {
      URL.revokeObjectURL(objectURL);
      if (img.width > width) {
        const newFile = await resizeImageByWidth(width, img, file);
        resolve(newFile);
      } else {
        resolve(file);
      }
    };
    img.src = objectURL;
  });
};
