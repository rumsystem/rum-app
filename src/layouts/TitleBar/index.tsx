import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { shell, ipcRenderer } from 'electron';
import { getCurrentWindow } from '@electron/remote';
import { MenuItem } from '@mui/material';
import { useStore } from 'store';
import { myGroup } from 'standaloneModals/myGroup';
import { changeFontSize } from 'standaloneModals/changeFontSize';
import { migrate } from 'standaloneModals/migrate';
import { about } from 'standaloneModals/about';
import openBetaFeaturesModal from 'standaloneModals/openBetaFeaturesModal';
import openDevNetworkModal from 'standaloneModals/openDevNetworkModal';
import { lang } from 'utils/lang';
import { i18n, AllLanguages } from 'store/i18n';
import useCleanLocalData from 'hooks/useCleanLocalData';
import IconLangLocal from 'assets/lang_local.svg';
import { DropdownMenu } from 'components/DropdownMenu';
import { GoSync } from 'react-icons/go';

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
  const isLogin = !!nodeStore.storagePath;

  const menuLeft: Array<MenuItem> = [
    !!process.env.IS_ELECTRON && {
      text: 'Rum',
      children: [
        {
          text: lang.about,
          action: () => {
            about();
          },
        },
        {
          text: lang.lab,
          action: () => {
            openBetaFeaturesModal();
          },
          hidden: !isLogin,
        },
        {
          text: lang.exit,
          action: () => {
            ipcRenderer.send('quit');
          },
        },
      ],
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
          hidden: !isLogin,
        },
        {
          text: lang.clearCache,
          action: () => {
            cleanLocalData();
          },
          hidden: !isLogin,
        },
        {
          text: lang.relaunch,
          action: () => {
            ipcRenderer.send('relaunch');
            ipcRenderer.send('quit');
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
            const url = i18n.state.lang === 'cn' ? 'https://guide.rumsystem.net/' : 'https://guide-en.rumsystem.net/';
            if (process.env.IS_ELECTRON) {
              shell.openExternal(url);
            } else {
              window.open(url);
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
          text: lang.migrate + '...',
          action: () => {
            migrate();
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

    <div
      className="menu-bar fixed left-0 right-0 bg-black text-white flex justify-between items-stretch px-2"
    >
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
        {nodeStore.connected && (
          <button
            className="self-center border rounded py-1 px-2 mx-1 cursor-pointer flex items-center hover:bg-gray-4a"
            onClick={() => {
              if (!process.env.IS_ELECTRON) {
                window.location.reload();
              } else {
                getCurrentWindow().reload();
              }
            }}
          >
            <GoSync className='text-18 mr-1' />
            {lang.refresh}
          </button>
        )}
        {menuRight.map((menu, i) => (
          <DropdownMenu menu={menu} key={'menu-rigth-' + i} />
        ))}
      </div>
    </div>
  </>);
});
