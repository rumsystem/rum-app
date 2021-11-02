const {
  app,
  Menu,
  shell,
  BrowserWindow,
  MenuItemConstructorOptions,
} = require('electron');

class MenuBuilder {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu() {
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.DEBUG_PROD === 'true'
    ) {
      this.setupDevelopmentEnvironment();
    }

    const template =
      process.platform === 'darwin'
        ? this.buildDarwinTemplate()
        : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment() {
    this.mainWindow.webContents.on('context-menu', (_, props) => {
      const { x, y } = props;

      Menu.buildFromTemplate([
        {
          label: 'Inspect element',
          click: () => {
            this.mainWindow.webContents.inspectElement(x, y);
          },
        },
      ]).popup({ window: this.mainWindow });
    });
  }

  buildDarwinTemplate() {
    const subMenuAbout = {
      label: 'PRS ATM',
      submenu: [
        {
          label: '关于 PRS ATM',
          selector: 'orderFrontStandardAboutPanel:',
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
          label: '反馈问题',
          click() {
            shell.openExternal('https://github.com/Press-One/PRS-ATM-APP/issues');
          },
        },
      ],
    };

    return [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, subMenuHelp];
  }

  buildDefaultTemplate() {
    const templateDefault = [
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
            label: '全屏',
            accelerator: 'F11',
            click: () => {
              this.mainWindow.setFullScreen(
                !this.mainWindow.isFullScreen()
              );
            },
          },
        ]
      },
      {
        label: '帮助',
        submenu: [
          {
            label: '反馈问题',
            click() {
              shell.openExternal('https://github.com/Press-One/PRS-ATM-APP/issues');
            },
          }
        ],
      },
    ];

    return templateDefault;
  }
}

module.exports = MenuBuilder;
