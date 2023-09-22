import { ipcMain } from 'electron';

const state = {
  listeners: [] as Array<(p: string) => unknown>,
  lang: 'cn',
};

type LangType = typeof cn;

const cn = {
  service: '服务',
  hide: '隐藏',
  hideOther: '隐藏其他',
  showAll: '显示所有',
  quit: '退出',

  edit: '编辑',
  undo: '撤销',
  redo: '重做',
  cut: '剪切',
  copy: '复制',
  paste: '粘贴',
  saveImage: '将图片另存为(&v)…',
  selectAll: '全选',

  view: '视图',
  reload: '重新加载此页',
  devtools: '切换开发者工具',

  window: '窗口',
  min: '最小化',
  close: '关闭',
  front: '前置全部窗口',

  debug: '调试',
  exportLogs: '导出调试包',

  yes: '确定',
  windowMinimize: '窗口最小化',
  runInBackground: 'RUM 将继续在后台运行, 可通过系统状态栏重新打开界面',
  doNotRemind: '不再提示',
};

const en: LangType = {
  service: 'Service',
  hide: 'Hide',
  hideOther: 'Hide Other',
  showAll: 'Show All',
  quit: 'Quit',

  edit: 'Edit',
  undo: 'Undo',
  redo: 'Redo',
  cut: 'Cut',
  copy: 'Copy',
  paste: 'Paste',
  saveImage: 'Sa&ve Image As…',
  selectAll: 'Select All',

  view: 'View',
  reload: 'Reload App',
  devtools: 'Toggle Devtools',

  window: 'window',
  min: 'Minimize',
  close: 'Close',
  front: 'Arrange In Front',

  debug: 'Debug',
  exportLogs: 'Export Logs',

  yes: 'OK',
  windowMinimize: 'Minimize Window',
  doNotRemind: 'Don\'t remind me again',
  runInBackground: 'RUM is going to run in background, you can find it later in system tray.',
};

ipcMain.on('change-language', (_, lang) => {
  state.lang = lang;
  state.listeners.forEach((v) => v(state.lang));
});

export const mainLang = new Proxy({}, {
  get: (_, p) => {
    const object: any = state.lang === 'en' ? en : cn;
    return object[p];
  },
}) as LangType;

export const onLanguageChange = (cb: (lang: string) => unknown) => {
  state.listeners.push(cb);
  return () => {
    const index = state.listeners.indexOf(cb);
    if (index !== -1) {
      state.listeners.splice(index, 1);
    }
  };
};
