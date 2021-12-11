const {
  app,
  Menu,
  shell,
  electron,
} = require('electron');

const { autoUpdater } = require('electron-updater');

class MenuBuilder {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu() {
    if (
      process.env.NODE_ENV === 'development'
      || process.env.DEBUG_PROD === 'true'
    ) {
      this.setupDevelopmentEnvironment();
    }

    const template = process.platform === 'darwin'
      ? this.buildDarwinTemplate()
      : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment() {
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
          label: 'Cu&t',
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
          label: '&Copy',
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
          label: '&Paste',
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
          label: '检查更新',
          click: () => {
            autoUpdater.checkForUpdates();
            this.mainWindow.webContents.send('check-for-updates-manually');
          },
        },
        { type: 'separator' },
        { label: '服务', submenu: [] },
        { type: 'separator' },
        {
          label: '隐藏',
          accelerator: 'Command+H',
          selector: 'hide:',
        },
        {
          label: '隐藏其他',
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:',
        },
        { label: '显示所有', selector: 'unhideAllApplications:' },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    };
    const subMenuEdit = {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'Command+Z', selector: 'undo:' },
        { label: '重做', accelerator: 'Shift+Command+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: '剪切', accelerator: 'Command+X', selector: 'cut:' },
        { label: '复制', accelerator: 'Command+C', selector: 'copy:' },
        { label: '粘贴', accelerator: 'Command+V', selector: 'paste:' },
        {
          label: '全选',
          accelerator: 'Command+A',
          selector: 'selectAll:',
        },
      ],
    };
    const subMenuView = {
      label: '视图',
      submenu: [
        {
          label: '重新加载此页',
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload();
          },
        },
        {
          label: '切换开发者工具',
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.webContents.toggleDevTools();
          },
        },
        {
          label: '切换内置/外部节点',
          click: () => {
            this.mainWindow.webContents.send('toggle-mode');
          },
        },
        {
          label: '全屏',
          accelerator: 'Ctrl+Command+F',
          click: () => {
            this.mainWindow.setFullScreen(!this.mainWindow.isFullScreen());
          },
        },
      ],
    };
    const subMenuWindow = {
      label: '窗口',
      submenu: [
        {
          label: '最小化',
          accelerator: 'Command+M',
          selector: 'performMiniaturize:',
        },
        { label: '关闭', accelerator: 'Command+W', selector: 'performClose:' },
        { type: 'separator' },
        { label: '前置全部窗口', selector: 'arrangeInFront:' },
      ],
    };
    const subMenuHelp = {
      label: '帮助',
      submenu: [
        {
          label: '帮助手册',
          click() {
            shell.openExternal('https://docs.prsdev.club/#/rum-app/');
          },
        },
        {
          label: '反馈问题',
          click() {
            shell.openExternal('https://github.com/Press-One/rum-app/issues');
          },
        },
        {
          label: '清除本地数据',
          click: () => {
            this.mainWindow.webContents.send('clean-local-data');
          },
        },
        {
          label: '导出调试包',
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
            label: '检查更新',
            click: () => {
              autoUpdater.checkForUpdates();
              this.mainWindow.webContents.send('check-for-updates-manually');
            },
          },
        ],
      },
      {
        label: '&视图',
        submenu: [
          {
            label: '&重新加载此页',
            accelerator: 'Ctrl+R',
            click: () => {
              this.mainWindow.webContents.reload();
            },
          },
          {
            label: '切换开发者工具',
            accelerator: 'Alt+Ctrl+I',
            click: () => {
              this.mainWindow.webContents.toggleDevTools();
            },
          },
          {
            label: '切换内置/外部节点',
            click: () => {
              this.mainWindow.webContents.send('toggle-mode');
            },
          },
          {
            label: '全屏',
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
        label: '帮助',
        submenu: [
          {
            label: '帮助手册',
            click() {
              shell.openExternal('https://docs.prsdev.club/#/rum-app/');
            },
          },
          {
            label: '反馈问题',
            click() {
              shell.openExternal('https://github.com/Press-One/rum-app/issues');
            },
          },
          {
            label: '清除本地数据',
            click: () => {
              this.mainWindow.webContents.send('clean-local-data');
            },
          },
          {
            label: '导出调试包',
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
