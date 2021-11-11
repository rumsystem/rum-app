const {
  app,
  Menu,
  shell,
  electron,
  ipcMain,
} = require('electron');

const { autoUpdater } = require('electron-updater');

class MenuBuilder {
  language = 'cn';
  cn = {
    update: '检查更新',
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
    selectAll: '全选',

    view: '视图',
    reload: '重新加载此页',
    devtools: '切换开发者工具',
    changeMode: '切换内置/外部节点',
    fullscreen: '全屏',

    window: '窗口',
    min: '最小化',
    close: '关闭',
    front: '前置全部窗口',

    help: '帮助',
    manual: '帮助手册',
    report: '反馈问题',
    clearCache: '清除本地数据',
    exportLogs: '导出调试包',
  }
  en = {
    update: 'Check Update',
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
    selectAll: 'Select All',

    view: 'View',
    reload: 'Reload App',
    devtools: 'Toggle Devtools',
    changeMode: 'Switch Internal/External Mode',
    fullscreen: 'Fullscreen',

    window: 'window',
    min: 'Minimize',
    close: 'Close',
    front: 'Arrange In Front',

    help: 'Help',
    manual: 'Manual',
    report: 'Report Issue',
    clearCache: 'Clear Local Cache',
    exportLogs: 'Export Logs',
  }

  dispose = null;

  get lang() {
    return this[this.language];
  }

  constructor(mainWindow) {
    this.mainWindow = mainWindow;

    ipcMain.on('change-language', (_, lang) => {
      this.language = lang;
      console.log(lang);
      this.rebuildMenu();
    });
  }

  buildMenu() {
    this.setupContextMenu();

    const template = process.platform === 'darwin'
      ? this.buildDarwinTemplate()
      : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  rebuildMenu() {
    const template = process.platform === 'darwin'
      ? this.buildDarwinTemplate()
      : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupContextMenu() {
    this.mainWindow.webContents.on('context-menu', (event, props) => {
      const hasText = props.selectionText.trim().length > 0;

      const menuTemplate = [
        process.env.NODE_ENV === 'development' && {
          id: 'inspect',
          label: 'I&nspect Element',
          click: () => {
            this.mainWindow.inspectElement(props.x, props.y);
            if (this.mainWindow.webContents.isDevToolsOpened()) {
              this.mainWindow.webContents.devToolsWebContents.focus();
            }
          },
        },
        {
          id: 'cut',
          label: this.lang.cut,
          accelerator: 'CommandOrControl+X',
          enabled: props.editFlags.canCut,
          visible: props.isEditable,
          click(menuItem) {
            const target = this.mainWindow.webContents;
            if (!menuItem.transform && target) {
              target.cut();
            } else {
              props.selectionText = menuItem.transform ? menuItem.transform(props.selectionText) : props.selectionText;
              electron.clipboard.writeText(props.selectionText);
            }
          },
        },
        {
          id: 'copy',
          label: this.lang.copy,
          accelerator: 'CommandOrControl+C',
          enabled: props.editFlags.canCopy,
          visible: props.isEditable || hasText,
          click: (menuItem) => {
            const target = this.mainWindow.webContents;

            if (!menuItem.transform && target) {
              target.copy();
            } else {
              props.selectionText = menuItem.transform ? menuItem.transform(props.selectionText) : props.selectionText;
              electron.clipboard.writeText(props.selectionText);
            }
          },
        },
        {
          id: 'paste',
          label: this.lang.paste,
          accelerator: 'CommandOrControl+V',
          enabled: props.editFlags.canPaste,
          visible: props.isEditable,
          click: (menuItem) => {
            const target = this.mainWindow.webContents;

            if (menuItem.transform) {
              let clipboardContent = electron.clipboard.readText(props.selectionText);
              clipboardContent = menuItem.transform ? menuItem.transform(clipboardContent) : clipboardContent;
              target.insertText(clipboardContent);
            } else {
              target.paste();
            }
          },
        },
      ].filter(Boolean);

      Menu.buildFromTemplate(menuTemplate).popup({ window: this.mainWindow });
    });
  }

  buildDarwinTemplate() {
    const subMenuAbout = {
      label: 'Rum',
      submenu: [
        {
          label: this.lang.update,
          click: () => {
            autoUpdater.checkForUpdates();
            this.mainWindow.webContents.send('check-for-updates-manually');
          },
        },
        { type: 'separator' },
        { label: this.lang.service, submenu: [] },
        { type: 'separator' },
        {
          label: this.lang.hide,
          accelerator: 'Command+H',
          selector: 'hide:',
        },
        {
          label: this.lang.hideOther,
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:',
        },
        { label: this.lang.showAll, selector: 'unhideAllApplications:' },
        { type: 'separator' },
        {
          label: this.lang.quit,
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    };
    const subMenuEdit = {
      label: this.lang.edit,
      submenu: [
        { label: this.lang.undo, accelerator: 'Command+Z', selector: 'undo:' },
        { label: this.lang.redo, accelerator: 'Shift+Command+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: this.lang.cut, accelerator: 'Command+X', selector: 'cut:' },
        { label: this.lang.copy, accelerator: 'Command+C', selector: 'copy:' },
        { label: this.lang.paste, accelerator: 'Command+V', selector: 'paste:' },
        {
          label: this.lang.selectAll,
          accelerator: 'Command+A',
          selector: 'selectAll:',
        },
      ],
    };
    const subMenuView = {
      label: this.lang.view,
      submenu: [
        {
          label: this.lang.reload,
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload();
          },
        },
        {
          label: this.lang.devtools,
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.webContents.toggleDevTools();
          },
        },
        {
          label: this.lang.changeMode,
          click: () => {
            this.mainWindow.webContents.send('toggle-mode');
          },
        },
        {
          label: this.lang.fullscreen,
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
      ],
    };
    const subMenuWindow = {
      label: this.lang.window,
      submenu: [
        {
          label: this.lang.min,
          accelerator: 'Command+M',
          selector: 'performMiniaturize:',
        },
        { label: this.lang.close, accelerator: 'Command+W', selector: 'performClose:' },
        { type: 'separator' },
        { label: this.lang.front, selector: 'arrangeInFront:' },
      ],
    };
    const subMenuHelp = {
      label: this.lang.help,
      submenu: [
        {
          label: this.lang.manual,
          click() {
            shell.openExternal('https://docs.prsdev.club/#/rum-app/');
          },
        },
        {
          label: this.lang.report,
          click() {
            shell.openExternal('https://github.com/Press-One/rum-app/issues');
          },
        },
        {
          label: this.lang.clearCache,
          click: () => {
            this.mainWindow.webContents.send('clean-local-data');
          },
        },
        {
          label: this.lang.exportLogs,
          click: () => {
            this.mainWindow.webContents.send('export-logs');
          },
        },
      ],
    };

    return [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp];
  }

  buildDefaultTemplate() {
    const templateDefault = [
      {
        label: 'Rum',
        submenu: [
          {
            label: this.lang.update,
            click: () => {
              autoUpdater.checkForUpdates();
              this.mainWindow.webContents.send('check-for-updates-manually');
            },
          },
        ],
      },
      {
        label: this.lang.view,
        submenu: [
          {
            label: this.lang.reload,
            accelerator: 'Ctrl+R',
            click: () => {
              this.mainWindow.webContents.reload();
            },
          },
          {
            label: this.lang.devtools,
            accelerator: 'Alt+Ctrl+I',
            click: () => {
              this.mainWindow.webContents.toggleDevTools();
            },
          },
          {
            label: this.lang.changeMode,
            click: () => {
              this.mainWindow.webContents.send('toggle-mode');
            },
          },
          {
            label: this.lang.fullscreen,
            accelerator: 'F11',
            click: () => {
              this.mainWindow.setFullScreen(
                !this.mainWindow.isFullScreen(),
              );
            },
          },
        ],
      },
      {
        label: this.lang.help,
        submenu: [
          {
            label: this.lang.manual,
            click() {
              shell.openExternal('https://docs.prsdev.club/#/rum-app/');
            },
          },
          {
            label: this.lang.report,
            click() {
              shell.openExternal('https://github.com/Press-One/rum-app/issues');
            },
          },
          {
            label: this.lang.clearCache,
            click: () => {
              this.mainWindow.webContents.send('clean-local-data');
            },
          },
          {
            label: this.lang.exportLogs,
            click: () => {
              this.mainWindow.webContents.send('export-logs');
            },
          },
        ],
      },
    ];

    return templateDefault;
  }
}

module.exports = MenuBuilder;
