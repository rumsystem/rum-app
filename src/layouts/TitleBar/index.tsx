import React from 'react';
import classNames from 'classnames';
import { ipcRenderer } from 'electron';
import { getCurrentWindow, shell } from '@electron/remote';
import {
  MenuItem,
  MenuList,
  Popover,
} from '@material-ui/core';
import { assetsBasePath } from 'utils/env';
import { useStore } from 'store';

import './index.sass';

interface Props {
  className?: string
}

interface MenuItem {
  text: string
  action?: () => unknown
  children?: Array<MenuItem>
}

export const TitleBar = (props: Props) => {
  const { modalStore } = useStore();

  const menuLeft: Array<MenuItem> = [
    {
      text: '重新加载',
      action: () => {
        getCurrentWindow().reload();
      },
    },
    {
      text: '检查更新',
      action: () => {
        ipcRenderer.send('check-for-update-from-renderer');
        getCurrentWindow().webContents.send('check-for-updates-manually');
      },
    },
    {
      text: '开发者调试',
      children: [
        {
          text: '切换开发者工具',
          action: () => {
            getCurrentWindow().webContents.toggleDevTools();
          },
        },
        {
          text: '切换内置/外部节点',
          action: () => {
            getCurrentWindow().webContents.send('toggle-mode');
          },
        },
        {
          text: '导出调试包',
          action: () => {
            getCurrentWindow().webContents.send('export-logs');
          },
        },
        {
          text: '清除本地数据',
          action: () => {
            getCurrentWindow().webContents.send('clean-local-data');
          },
        },
      ],
    },
    {
      text: '关于和帮助',
      children: [
        {
          text: '帮助手册',
          action: () => {
            shell.openExternal('https://docs.prsdev.club/#/rum-app/');
          },
        },
        {
          text: '反馈问题',
          action: () => {
            shell.openExternal('https://github.com/Press-One/rum-app/issues');
          },
        },
        {
          text: '关于 Rum',
          action: () => {
            // TODO:
          },
        },
      ],
    },
  ];
  const menuRight: Array<MenuItem> = [
    {
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
  ];

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

                <Popover
                  open={open}
                  onClose={() => setOpen(false)}
                  anchorEl={buttonRef.current}
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
                    {v.children?.map((v, i) => (
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
};
