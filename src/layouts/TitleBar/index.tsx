import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { ipcRenderer } from 'electron';
import { getCurrentWindow, shell } from '@electron/remote';
import {
  MenuItem,
  MenuList,
  Popover,
} from '@material-ui/core';
import { assetsBasePath } from 'utils/env';
import { useStore } from 'store';
import { languageSelect } from 'standaloneModals/languageSelect';
import { lang } from './lang';

import './index.sass';

interface Props {
  className?: string
}

interface MenuItem {
  text: string
  action?: () => unknown
  children?: Array<MenuItem>
}

export const TitleBar = observer((props: Props) => {
  const { modalStore, nodeStore } = useStore();

  const menuLeft: Array<MenuItem> = [
    {
      text: lang.reload,
      action: () => {
        getCurrentWindow().reload();
      },
    },
    {
      text: lang.update,
      action: () => {
        ipcRenderer.send('check-for-update-from-renderer');
        getCurrentWindow().webContents.send('check-for-updates-manually');
      },
    },
    {
      text: lang.dev,
      children: [
        {
          text: lang.devtools,
          action: () => {
            getCurrentWindow().webContents.toggleDevTools();
          },
        },
        {
          text: lang.modeToggle,
          action: () => {
            getCurrentWindow().webContents.send('toggle-mode');
          },
        },
        {
          text: lang.exportLogs,
          action: () => {
            getCurrentWindow().webContents.send('export-logs');
          },
        },
        {
          text: lang.clearCache,
          action: () => {
            getCurrentWindow().webContents.send('clean-local-data');
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
            shell.openExternal('https://docs.prsdev.club/#/rum-app/');
          },
        },
        {
          text: lang.report,
          action: () => {
            shell.openExternal('https://github.com/Press-One/rum-app/issues');
          },
        },
        {
          text: lang.about,
          action: () => {
            // TODO:
          },
        },
        {
          text: lang.switchLang,
          action: () => {
            languageSelect();
          },
        },
      ],
    },
  ];
  const menuRight: Array<MenuItem> = [
    nodeStore.connected && {
      text: '节点与网络',
      action: () => {
        modalStore.myNodeInfo.open();
      },
    },
    // {
    //   text: '我的资产（建设中）',
    //   action: () => {
    //   },
    // },
    // {
    //   text: '账号与设置',
    //   action: () => {
    //   },
    // },
  ].filter(<T extends unknown>(v: false | T): v is T => !!v);

  const handleMinimize = () => {
    getCurrentWindow().minimize();
  };

  const handleMaximize = () => {
    const window = getCurrentWindow();
    if (window.isMaximized()) {
      window.restore();
    } else {
      window.maximize();
    }
  };

  const handleClose = () => {
    getCurrentWindow().close();
  };

  const logoPath = `${assetsBasePath}/logo_rumsystem_banner.svg`;
  const bannerPath = `${assetsBasePath}/status_bar_pixel_banner.svg`;
  const minPath = `${assetsBasePath}/apps-button/status_bar_button_min.svg`;
  const maxPath = `${assetsBasePath}/apps-button/status_bar_button_fullscreen.svg`;
  const closePath = `${assetsBasePath}/apps-button/status_bar_button_exit.svg`;

  return (<>
    <div
      className={classNames(
        props.className,
        'app-title-bar-placeholder',
      )}
    />
    <div
      className={classNames(
        props.className,
        'app-title-bar fixed top-0 left-0 right-0',
      )}
    >
      <div
        className="title-bar flex justify-between"
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

        <div className="apps-button-box flex items-center ml-4 absolute right-0 top-0">
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
      <div className="menu-bar bg-black text-white flex justify-between items-stretch px-4">
        <div className="flex items-stertch">
          {menuLeft.map((v, i) => {
            const buttonRef = React.useRef<HTMLButtonElement>(null);
            const [open, setOpen] = React.useState(false);

            return (
              <React.Fragment key={i}>
                <button
                  className={classNames(
                    'px-4 mx-1 cursor-pointer flex items-center focus:bg-gray-4a',
                    open && 'bg-gray-4a',
                  )}
                  onClick={v.action ?? (() => setOpen(true))}
                  ref={buttonRef}
                >
                  {v.text}
                </button>

                {!!v.children && (
                  <Popover
                    open={open}
                    onClose={() => setOpen(false)}
                    anchorEl={buttonRef.current}
                    style={{ zIndex: 1000000001 }}
                    PaperProps={{
                      className: 'bg-black text-white',
                      square: true,
                      elevation: 2,
                    }}
                    anchorOrigin={{
                      horizontal: 'center',
                      vertical: 'bottom',
                    }}
                    transformOrigin={{
                      horizontal: 'center',
                      vertical: 'top',
                    }}
                  >
                    <MenuList>
                      {v.children.map((v, i) => (
                        <MenuItem
                          className="hover:bg-gray-4a duration-0"
                          onClick={() => {
                            v.action?.();
                            setOpen(false);
                          }}
                          key={i}
                        >
                          {v.text}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </Popover>
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div className="flex items-stertch">
          {menuRight.map((v, i) => (
            <button
              className="px-4 mx-1 cursor-pointer flex items-center focus:bg-gray-4a"
              onClick={v.action}
              key={i}
            >
              {v.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  </>);
});
