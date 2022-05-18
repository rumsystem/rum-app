import { download } from 'electron-dl';
import {
  app,
  Menu,
  clipboard,
  BrowserWindow,
} from 'electron';
import { format } from 'date-fns';
import { mainLang, onLanguageChange } from './lang';

export class MenuBuilder {
  language = 'cn';
  dispose = null;

  constructor(private mainWindow: BrowserWindow) {
    onLanguageChange(() => {
      this.rebuildMenu();
    });
  }

  buildMenu() {
    this.setupContextMenu();

    if (process.platform === 'darwin') {
      const template = this.buildDarwinTemplate();

      const menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);
    } else {
      Menu.setApplicationMenu(null);
    }
  }

  rebuildMenu() {
    if (process.platform === 'darwin') {
      const template = this.buildDarwinTemplate();

      const menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);
    } else {
      Menu.setApplicationMenu(null);
    }
  }

  setupContextMenu() {
    this.mainWindow.webContents.on('context-menu', (_event, props) => {
      const hasText = props.selectionText.trim().length > 0;

      const menuTemplate = [
        (process.env.NODE_ENV === 'development' || process.env.devtool) && {
          id: 'inspect',
          label: 'I&nspect Element',
          click: () => {
            (this.mainWindow as any).inspectElement(props.x, props.y);
            if (this.mainWindow.webContents.isDevToolsOpened()) {
              this.mainWindow.webContents.devToolsWebContents?.focus();
            }
          },
        },
        {
          id: 'cut',
          label: mainLang.cut,
          accelerator: 'CommandOrControl+X',
          enabled: props.editFlags.canCut,
          visible: props.isEditable,
          click: (menuItem: any) => {
            const target = this.mainWindow.webContents;
            if (!menuItem.transform && target) {
              target.cut();
            } else {
              props.selectionText = menuItem.transform ? menuItem.transform(props.selectionText) : props.selectionText;
              clipboard.writeText(props.selectionText);
            }
          },
        },
        {
          id: 'copy',
          label: mainLang.copy,
          accelerator: 'CommandOrControl+C',
          enabled: props.editFlags.canCopy,
          visible: props.isEditable || hasText,
          click: (menuItem: any) => {
            const target = this.mainWindow.webContents;

            if (!menuItem.transform && target) {
              target.copy();
            } else {
              props.selectionText = menuItem.transform ? menuItem.transform(props.selectionText) : props.selectionText;
              clipboard.writeText(props.selectionText);
            }
          },
        },
        {
          id: 'paste',
          label: mainLang.paste,
          accelerator: 'CommandOrControl+V',
          enabled: props.editFlags.canPaste,
          visible: props.isEditable,
          click: (menuItem: any) => {
            const target = this.mainWindow.webContents;

            if (menuItem.transform) {
              let clipboardContent = clipboard.readText('clipboard');
              clipboardContent = menuItem.transform ? menuItem.transform(clipboardContent) : clipboardContent;
              target.insertText(clipboardContent);
            } else {
              target.paste();
            }
          },
        },
        {
          id: 'saveImageAs',
          label: mainLang.saveImage,
          visible: props.mediaType === 'image',
          click: () => {
            download(
              this.mainWindow,
              props.srcURL,
              {
                saveAs: true,
                filename: `Rum${format(new Date(), 'yyyy-MM-dd_hh-MM-ss')}.jpg`,
              },
            );
          },
        },
      ].filter(Boolean);

      Menu.buildFromTemplate(menuTemplate as any).popup({ window: this.mainWindow });
    });
  }

  buildDarwinTemplate(): any {
    const subMenuAbout = {
      label: 'Rum',
      submenu: [
        { label: mainLang.service, submenu: [] },
        { type: 'separator' },
        {
          label: mainLang.hide,
          accelerator: 'Command+H',
          selector: 'hide:',
        },
        {
          label: mainLang.hideOther,
          accelerator: 'Command+Shift+H',
          selector: 'hideOtherApplications:',
        },
        { label: mainLang.showAll, selector: 'unhideAllApplications:' },
        { type: 'separator' },
        {
          label: mainLang.quit,
          accelerator: 'Command+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    };
    const subMenuEdit = {
      label: mainLang.edit,
      submenu: [
        { label: mainLang.undo, accelerator: 'Command+Z', selector: 'undo:' },
        { label: mainLang.redo, accelerator: 'Shift+Command+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: mainLang.cut, accelerator: 'Command+X', selector: 'cut:' },
        { label: mainLang.copy, accelerator: 'Command+C', selector: 'copy:' },
        { label: mainLang.paste, accelerator: 'Command+V', selector: 'paste:' },
        {
          label: mainLang.selectAll,
          accelerator: 'Command+A',
          selector: 'selectAll:',
        },
      ],
    };
    const subMenuView = {
      label: mainLang.view,
      submenu: [
        {
          label: mainLang.reload,
          accelerator: 'Command+R',
          click: () => {
            this.mainWindow.webContents.reload();
          },
        },
        {
          label: mainLang.devtools,
          accelerator: 'Alt+Command+I',
          click: () => {
            this.mainWindow.webContents.toggleDevTools();
          },
        },
      ],
    };
    const subMenuWindow = {
      label: mainLang.window,
      submenu: [
        {
          label: mainLang.min,
          accelerator: 'Command+M',
          selector: 'performMiniaturize:',
        },
        { label: mainLang.close, accelerator: 'Command+W', selector: 'performClose:' },
        { type: 'separator' },
        { label: mainLang.front, selector: 'arrangeInFront:' },
      ],
    };

    const subMenuDebug = {
      label: mainLang.debug,
      submenu: [
        {
          label: mainLang.exportLogs,
          click: () => {
            this.mainWindow.webContents.send('export-logs');
          },
        },
      ],
    };

    return [subMenuAbout, subMenuEdit, subMenuView, subMenuWindow, subMenuDebug];
  }

  buildDefaultTemplate(): any {
    return [];
  }
}
