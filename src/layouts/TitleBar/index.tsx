import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { ipcRenderer } from 'electron';
import { getCurrentWindow, shell, app } from '@electron/remote';
import { MenuItem } from '@material-ui/core';
import { useStore } from 'store';
import { myGroup } from 'standaloneModals/myGroup';
import { changeFontSize } from 'standaloneModals/changeFontSize';
import { exportKeyData } from 'standaloneModals/exportKeyData2';
import { importKeyData } from 'standaloneModals/importKeyData';
// import { importKeyDataBrowser } from 'standaloneModals/importKeyDataBrowser';
import { lang } from 'utils/lang';
import { i18n, AllLanguages } from 'store/i18n';
import useCleanLocalData from 'hooks/useCleanLocalData';
import IconLangLocal from 'assets/lang_local.svg';
import { TitleBarItem } from './TitleBarItem';

import './index.sass';

interface Props {
  className?: string
}

interface MenuItem {
  text: string
  action?: () => unknown
  children?: Array<MenuItem>
  hidden?: boolean
  icon?: string
  checked?: boolean
}

export const TitleBar = observer((props: Props) => {
  const { modalStore, nodeStore } = useStore();
  const cleanLocalData = useCleanLocalData();

  const menuLeft: Array<MenuItem> = [
    {
      text: lang.refresh,
      action: () => {
        if (!process.env.IS_ELECTRON) {
          window.location.reload();
        } else {
          getCurrentWindow().reload();
        }
      },
    },
    !!process.env.IS_ELECTRON && {
      text: lang.checkForUpdate,
      action: () => {
        if (!process.env.IS_ELECTRON) {
          // TODO:
          // eslint-disable-next-line no-alert
          alert('TODO');
          return;
        }
        ipcRenderer.send('check-for-update-from-renderer');
      },
    },
    {
      text: lang.dev,
      children: [
        {
          text: lang.devtools,
          action: () => {
            if (!process.env.IS_ELECTRON) {
              // TODO:
              // eslint-disable-next-line no-alert
              alert('TODO');
              return;
            }
            getCurrentWindow().webContents.toggleDevTools();
          },
        },
        {
          text: lang.exportLogs,
          action: () => {
            if (!process.env.IS_ELECTRON) {
              // TODO:
              // eslint-disable-next-line no-alert
              alert('TODO');
              return;
            }
            getCurrentWindow().webContents.send('export-logs');
          },
        },
        {
          text: lang.clearCache,
          action: () => {
            cleanLocalData();
          },
        },
        {
          text: lang.relaunch,
          action: () => {
            app.relaunch();
            app.quit();
          },
        },
      ],
    },
    {
      text: lang.help,
      children: [
        {
          text: lang.manual,
          action: () => {
            if (process.env.IS_ELECTRON) {
              shell.openExternal('https://docs.prsdev.club/#/rum-app/');
            } else {
              window.open('https://docs.prsdev.club/#/rum-app/');
            }
          },
        },
        {
          text: lang.report,
          action: () => {
            if (process.env.IS_ELECTRON) {
              shell.openExternal('https://github.com/rumsystem/rum-app/issues');
            } else {
              window.open('https://github.com/rumsystem/rum-app/issues');
            }
          },
        },
      ],
    },
  ].filter(<T extends unknown>(v: false | T): v is T => !!v);
  const menuRight: Array<MenuItem> = [
    nodeStore.connected && {
      text: lang.nodeAndNetwork,
      action: () => {
        modalStore.myNodeInfo.open();
      },
    },
    nodeStore.connected && {
      text: lang.accountAndSettings,
      children: [
        {
          text: lang.myGroup,
          action: () => {
            myGroup();
          },
        },
        {
          text: lang.changeFontSize,
          action: () => {
            changeFontSize();
          },
        },
        {
          text: lang.exportKey,
          action: () => {
            exportKeyData();
          },
          hidden: !nodeStore.connected,
        },
        {
          text: lang.importKey,
          action: () => {
            importKeyData();
          },
        },
      ],
    },
    {
      text: lang.switchLang,
      icon: IconLangLocal,
      children: [
        {
          text: 'English',
          checked: i18n.state.lang === 'en',
          classNames: 'ml-2 pl-5',
          action: () => {
            i18n.switchLang('en' as AllLanguages);
          },
        },
        {
          text: '简体中文',
          checked: i18n.state.lang === 'cn',
          classNames: 'ml-2 pl-5',
          action: () => {
            i18n.switchLang('cn' as AllLanguages);
          },
        },
      ],
    },
  ].filter(<T extends unknown>(v: false | T): v is T => !!v);

  // const handleMinimize = () => {
  //   getCurrentWindow().minimize();
  // };

  // const handleMaximize = () => {
  //   const window = getCurrentWindow();
  //   if (window.isMaximized()) {
  //     window.restore();
  //   } else {
  //     window.maximize();
  //   }
  // };

  // const handleClose = () => {
  //   getCurrentWindow().close();
  // };

  // const logoPath = `${assetsBasePath}/logo_rumsystem_banner.svg`;
  // const bannerPath = `${assetsBasePath}/status_bar_pixel_banner.svg`;
  // const minPath = `${assetsBasePath}/apps-button/status_bar_button_min.svg`;
  // const maxPath = `${assetsBasePath}/apps-button/status_bar_button_fullscreen.svg`;
  // const closePath = `${assetsBasePath}/apps-button/status_bar_button_exit.svg`;

  return (<>
    <div
      className={classNames(
        props.className,
        'app-title-bar-placeholder',
      )}
    />

    {/* <div
      className="app-title-bar flex justify-between fixed top-0 left-0 right-0 hidden"
      style={{
        backgroundImage: `url('${bannerPath}')`,
      }}
    >
      <div
        className="app-logo flex self-stretch bg-white"
        style={{
          backgroundImage: `url('${logoPath}')`,
        }}
      />

      <div className="flex items-center ml-4 absolute right-0 top-0">
        {nodeStore.connected && nodeStore.mode === 'EXTERNAL' && (
          <div className="mr-6 cursor-pointer flex items-center text-white opacity-70 text-12 w-[auto] mt-[2px]">
            <div className="w-2 h-2 bg-emerald-300 rounded-full mr-2" />
            {lang.externalMode}
          </div>
        )}
        <div className="apps-button-box flex items-center">
          <div
            className="flex justify-center items-center non-drag ml-px"
            onClick={handleMinimize}
          >
            <img src={minPath} alt="" width="20" />
          </div>
          <div
            className="flex justify-center items-center non-drag ml-px"
            onClick={handleMaximize}
          >
            <img src={maxPath} alt="" width="20" />
          </div>
          <div
            className="close-btn flex justify-center items-center non-drag ml-px pr-2"
            onClick={handleClose}
          >
            <img src={closePath} alt="" width="20" />
          </div>
        </div>
      </div>
    </div> */}

    <div className="menu-bar fixed left-0 right-0 bg-black text-white flex justify-between items-stretch px-2">
      <div className="flex items-stertch">
        {menuLeft.map((menu, i) => (
          <TitleBarItem menu={menu} key={'menu-left-' + i} />
        ))}
      </div>
      <div className="flex items-stertch">
        {nodeStore.connected && nodeStore.mode === 'EXTERNAL' && (
          <div className="mr-6 cursor-pointer flex items-center text-white opacity-70 text-12 w-[auto] mt-[2px]">
            <div className="w-2 h-2 bg-emerald-300 rounded-full mr-2" />
            {lang.externalMode}
          </div>
        )}
        {menuRight.map((menu, i) => (
          <TitleBarItem menu={menu} key={'menu-rigth-' + i} />
        ))}
      </div>
    </div>
  </>);
});
