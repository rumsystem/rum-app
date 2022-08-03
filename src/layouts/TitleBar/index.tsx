import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { ipcRenderer } from 'electron';
import { getCurrentWindow, shell, app } from '@electron/remote';
import { MenuItem } from '@material-ui/core';
import { useStore } from 'store';
import { myGroup } from 'standaloneModals/myGroup';
import { changeFontSize } from 'standaloneModals/changeFontSize';
import { exportKeyData } from 'standaloneModals/exportKeyData';
import { importKeyData } from 'standaloneModals/importKeyData';
import openBetaFeaturesModal from 'standaloneModals/openBetaFeaturesModal';
import openDevNetworkModal from 'standaloneModals/openDevNetworkModal';
import { lang } from 'utils/lang';
import { i18n, AllLanguages } from 'store/i18n';
import useCleanLocalData from 'hooks/useCleanLocalData';
import IconLangLocal from 'assets/lang_local.svg';
import { DropdownMenu } from 'components/DropdownMenu';

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
    !!process.env.IS_ELECTRON && {
      text: 'Rum',
      children: [
        {
          text: lang.about,
          action: () => {
            shell.openExternal('https://rumsystem.net/');
          },
        },
        {
          text: lang.lab,
          action: () => {
            openBetaFeaturesModal();
          },
        },
        {
          text: lang.exit,
          action: () => {
            app.quit();
          },
        },
      ],
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
          text: lang.toggleDevNetwork,
          action: () => {
            openDevNetworkModal();
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
      text: lang.refresh,
      action: () => {
        if (!process.env.IS_ELECTRON) {
          window.location.reload();
        } else {
          getCurrentWindow().reload();
        }
      },
    },
    nodeStore.connected && {
      text: lang.nodeAndNetwork,
      action: () => {
        modalStore.myNodeInfo.open();
      },
      'data-test-id': 'header-node-and-network',
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
          classNames: 'pl-7',
          action: () => {
            i18n.switchLang('en' as AllLanguages);
          },
        },
        {
          text: '简体中文',
          checked: i18n.state.lang === 'cn',
          classNames: 'pl-7',
          action: () => {
            i18n.switchLang('cn' as AllLanguages);
          },
        },
      ],
    },
  ].filter(<T extends unknown>(v: false | T): v is T => !!v);

  return (<>
    <div
      className={classNames(
        props.className,
        'app-title-bar-placeholder',
      )}
    />

    <div className="menu-bar fixed left-0 right-0 bg-black text-white flex justify-between items-stretch px-2">
      <div className="flex items-stertch">
        {menuLeft.map((menu, i) => (
          <DropdownMenu menu={menu} key={'menu-left-' + i} />
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
          <DropdownMenu menu={menu} key={'menu-rigth-' + i} />
        ))}
      </div>
    </div>
  </>);
});
