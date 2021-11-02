import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import Tooltip from '@material-ui/core/Tooltip';
import sleep from 'utils/sleep';
import { StoreProvider, useStore } from 'store';
import { dialog } from '@electron/remote';
import fs from 'fs-extra';
import { action } from 'mobx';

interface SetStoragePathParams {
  /** 允许手动关闭 */
  canClose: boolean
}

type ResponseType = 'changed' | 'unchanged';

export default async (params: SetStoragePathParams) => new Promise<ResponseType>((rs) => {
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
          rs={(v) => {
            rs(v);
            setTimeout(unmount, 3000);
          }}
          force={!params.canClose}
        />
      </StoreProvider>
    ),
    div,
  );
});

interface Props {
  force?: boolean
  rs: (v: ResponseType) => unknown
}

const StoragePathSetting = observer((props: Props) => {
  const { confirmDialogStore, nodeStore } = useStore();
  const state = useLocalObservable(() => ({
    open: true,
    path: nodeStore.storagePath,
  }));

  const saveStoragePath = () => {
    if (nodeStore.storagePath !== state.path) {
      nodeStore.setStoragePath(state.path);
      handleClose(true);
    } else {
      handleClose(false);
    }
  };

  const openDirectory = async () => {
    try {
      const file = await dialog.showOpenDialog({
        properties: ['openDirectory'],
      });
      if (!file.canceled && file.filePaths) {
        const path = file.filePaths[0];
        if (state.path === path) {
          return;
        }
        if (nodeStore.storagePath && nodeStore.storagePath !== path) {
          confirmDialogStore.show({
            content:
              '修改目录之后，将在新的目录下运行一个新的节点，确定修改吗？',
            okText: '确定',
            ok: async () => {
              confirmDialogStore.hide();
              await sleep(400);
              tryHandleDirtyDir(path);
            },
          });
        } else {
          tryHandleDirtyDir(path);
        }
      }
    } catch (err) {
      console.log(err.message);
    }
  };

  const tryHandleDirtyDir = async (path: string) => {
    const files = await fs.readdir(path);
    if (files.filter((file) => file.startsWith('peer')).length !== 0) {
      confirmDialogStore.show({
        content: '这个目录存在一些节点数据，是否继续使用这些数据',
        okText: '是的',
        ok: () => {
          state.path = path;
          confirmDialogStore.hide();
        },
      });
    } else {
      state.path = path;
    }
  };

  const handleClose = action((changed: boolean) => {
    state.open = false;
    props.rs(changed ? 'changed' : 'unchanged');
  });

  return (
    <Dialog
      disableEscapeKeyDown={props.force}
      hideCloseButton={props.force}
      open={state.open}
      onClose={(_, r) => {
        if (['backdropClick', 'escapeKeyDown'].includes(r) && props.force) {
          return;
        }
        handleClose(false);
      }}
      transitionDuration={{
        enter: 300,
      }}
    >
      <div className="bg-white rounded-12 text-center p-8">
        <div className="w-65">
          <div className="text-18 font-bold text-gray-700">选择储存目录</div>
          {!state.path && (
            <div>
              <div className="mt-4 text-gray-9b tracking-wide leading-loose">
                请选择一个目录来储存数据
                <br />
                这份数据只是属于你
                <br />
                我们不会储存数据，也无法帮你找回
                <br />
                请务必妥善保管
              </div>
              <div className="mt-5">
                <Button fullWidth onClick={openDirectory}>
                  选择目录
                </Button>
              </div>
            </div>
          )}
          {state.path && (
            <div>
              <div className="flex pt-8 pb-1 px-2">
                <div className="text-left p-2 pl-3 border border-gray-300 text-gray-500 text-12 truncate flex-1 rounded-l-12 border-r-0">
                  <Tooltip placement="top" title={state.path} arrow interactive>
                    <div className="tracking-wide">
                      {state.path.length > 18
                        ? `...${state.path.slice(-18)}`
                        : state.path}
                    </div>
                  </Tooltip>
                </div>
                <Button
                  noRound
                  className="rounded-r-12 opacity-60"
                  size="small"
                  onClick={openDirectory}
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
  );
});
