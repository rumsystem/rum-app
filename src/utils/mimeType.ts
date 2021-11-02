const map: any = {
  gif: 'image/gif',
  htm: 'text/html',
  html: 'text/html',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jpe: 'image/jpeg',
  js: 'application/x-javascript',
  pdf: 'application/pdf',
  png: 'image/png',
  md: 'text/markdown',
  json: 'application/json',
};

export default {
  getByExt: (ext: string) => map[ext] || '',
};
