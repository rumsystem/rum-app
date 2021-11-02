import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import Tooltip from '@material-ui/core/Tooltip';
import { StoreProvider, useStore } from 'store';
import { dialog, getCurrentWindow } from '@electron/remote';
import fs from 'fs-extra';
import { action } from 'mobx';
import moment from 'moment';
import { BiChevronRight } from 'react-icons/bi';
import formatPath from 'utils/formatPath';

enum AuthType {
  login,
  signup,
}

export default async () => new Promise((rs: any) => {
  const div = document.createElement('div');
  document.body.append(div);
  const unmount = () => {
    unmountComponentAtNode(div);
    div.remove();
  };
  render(
    (
      <StoreProvider>
        <StoragePathSetting
          rs={() => {
            rs();
            setTimeout(unmount, 3000);
          }}
        />
      </StoreProvider>
    ),
    div,
  );
});

interface Props {
  rs: () => unknown
}

const StoragePathSetting = observer((props: Props) => {
  const { nodeStore, snackbarStore } = useStore();
  const state = useLocalObservable(() => ({
    authType: null as AuthType | null,
    showSelectAuthModal: true,
    path: nodeStore.storagePath,
  }));

  const handleSelectAuthType = (authType: AuthType) => {
    state.authType = authType;
  };

  const createDirectory = async () => {
    try {
      const file = await dialog.showOpenDialog(getCurrentWindow(), {
        properties: ['openDirectory'],
      });
      if (!file.canceled && file.filePaths) {
        const path = file.filePaths[0];
        const files = await fs.readdir(path);
        if (files.length === 0 && path.endsWith('/rum')) {
          state.path = path;
          return;
        }
        const rumDirs = files.filter((file) => file.startsWith('rum'));
        let dirName = 'rum';
        if (rumDirs.length > 0) {
          const existDir = files.find((file) => file === dirName);
          if (existDir) {
            const existPath = `${path}/${existDir}`;
            const isEmpty = (await fs.readdir(existPath)).length === 0;
            if (isEmpty) {
              state.path = existPath;
              return;
            }
          }
          dirName += `-${moment().format('YYYYMMDD')}`;
          const sameDayDirs = files.filter((file) => file.startsWith(dirName));
          if (sameDayDirs.length > 0) {
            dirName += `-${sameDayDirs.length + 1}`;
          }
        }
        const rumPath = `${path}/${dirName}`;
        await fs.mkdir(rumPath);
        state.path = rumPath;
      }
    } catch (err) {
      console.log(err.message);
    }
  };


  const selectDirectory = async () => {
    try {
      const file = await dialog.showOpenDialog(getCurrentWindow(), {
        properties: ['openDirectory'],
      });
      if (!file.canceled && file.filePaths) {
        const path = file.filePaths[0];
        if (state.path === path) {
          return;
        }
        const files = await fs.readdir(path);
        const peerDirs = files.filter((file) => file.startsWith('peerData'));
        if (peerDirs.length > 0) {
          state.path = path;
          return;
        }
        const rumDirs = files.filter((file) => file.startsWith('rum'));
        let validPath = '';
        for (const rumDir of rumDirs) {
          const files = await fs.readdir(`${path}/${rumDir}`);
          const peerDirs = files.filter((file) => file.startsWith('peerData'));
          if (peerDirs.length > 0) {
            validPath = `${path}/${rumDir}`;
            break;
          }
        }
        if (validPath) {
          state.path = validPath;
        } else {
          snackbarStore.show({
            message: '该文件夹没有节点数据，请重新选择哦',
            type: 'error',
            duration: 4000,
          });
        }
      }
    } catch (err) {
      console.log(err.message);
    }
  };

  const saveStoragePath = () => {
    nodeStore.setStoragePath(state.path);
    handleClose();
  };

  const handleClose = action(() => {
    state.authType = null;
    state.showSelectAuthModal = false;
    props.rs();
  });

  return (
    <div>
      <Dialog
        disableEscapeKeyDown={true}
        hideCloseButton
        open={state.showSelectAuthModal}
        transitionDuration={{
          enter: 300,
        }}
      >
        <div className="p-8 relative">
          <div className="w-60">
            <div
              className="border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-10 cursor-pointer"
              onClick={() => handleSelectAuthType(AuthType.signup)}
            >
              <div>
                <div className="text-gray-6d font-bold">创建节点</div>
                <div className="text-gray-af text-12 mt-[3px] tracking-wide">第一次使用</div>
              </div>
              <BiChevronRight className="text-gray-bd text-20" />
            </div>
            <div
              className="mt-4 border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-10 cursor-pointer"
              onClick={() => handleSelectAuthType(AuthType.login)}
            >
              <div>
                <div className="text-gray-6d font-bold">登录节点</div>
                <div className="text-gray-af text-12 mt-[3px] tracking-wide">已经拥有节点</div>
              </div>
              <BiChevronRight className="text-gray-bd text-20" />
            </div>
          </div>
        </div>
      </Dialog>
      <Dialog
        open={state.authType !== null}
        onClose={() => {
          state.authType = null;
        }}
        transitionDuration={{
          enter: 300,
        }}
      >
        <div className="bg-white rounded-12 text-center p-8">
          <div className="w-65">
            <div className="text-18 font-bold text-gray-700">{state.authType === AuthType.signup ? '创建节点' : '登录节点'}</div>
            {!state.path && (
              <div>
                {state.authType === AuthType.signup && (
                  <div className="mt-4 text-gray-9b tracking-wide leading-loose">
                    请选择一个文件夹来储存节点数据
                    <br />
                    这份数据只是属于你
                    <br />
                    我们不会储存数据，也无法帮你找回
                    <br />
                    请务必妥善保管
                  </div>
                )}
                {state.authType === AuthType.login && (
                  <div className="mt-4 text-gray-9b tracking-wide leading-loose">
                    创建节点时您选择了一个文件夹
                    <br />
                    里面保存了您的节点信息
                    <br />
                    现在请重新选中该文件夹
                    <br />
                    以登录该节点
                  </div>
                )}
                <div className="mt-5">
                  <Button fullWidth onClick={state.authType === AuthType.signup ? createDirectory : selectDirectory}>
                    选择文件夹
                  </Button>
                </div>
              </div>
            )}
            {state.path && (
              <div>
                <div className="flex pt-8 pb-1 px-2">
                  <div className="text-left p-2 pl-3 border border-gray-200 text-gray-500 bg-gray-100 text-12 truncate flex-1 rounded-l-12 border-r-0">
                    <Tooltip placement="top" title={state.path} arrow interactive>
                      <div className="tracking-wide">
                        {formatPath(state.path, { truncateLength: 17 })}
                      </div>
                    </Tooltip>
                  </div>
                  <Button
                    noRound
                    className="rounded-r-12 opacity-60"
                    size="small"
                    onClick={state.authType === AuthType.signup ? createDirectory : selectDirectory}
                  >
                    修改
                  </Button>
                </div>
                <div className="mt-8" onClick={saveStoragePath}>
                  <Button fullWidth>确定</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
});
