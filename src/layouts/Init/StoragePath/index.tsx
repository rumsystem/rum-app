import path from 'path';
import React from 'react';
import moment from 'moment';
import fs from 'fs-extra';
import { runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { dialog, getCurrentWindow } from '@electron/remote';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import { Tooltip } from '@material-ui/core';

import { useStore } from 'store';
import Button from 'components/Button';
import formatPath from 'utils/formatPath';

interface Props {
  authType: 'login' | 'signup' | 'external'
  onSelectPath: (p: string) => unknown
}

export const StoragePath = observer((props: Props) => {
  const { snackbarStore } = useStore();
  const state = useLocalObservable(() => ({
    storagePath: '',
  }));

  const handleSelectDir = async () => {
    const isFolderNameRum = (p: string) => {
      const folderName = /[/\\](.+?)$/.exec(p);
      return !!folderName && folderName[1] === 'rum';
    };
    const isEmptyFolder = async (p: string) => {
      const files = await TE.tryCatch(
        () => fs.readdir(p),
        () => null,
      )();
      return E.isRight(files) && !files.right.length;
    };
    const isRumDataFolder = async (p: string) => {
      const stat = await TE.tryCatch(
        () => fs.stat(p),
        () => null,
      )();
      if (E.isLeft(stat) || !stat.right.isDirectory()) {
        return false;
      }
      const files = await fs.readdir(p);
      return files.some((v) => v === 'peerData');
    };
    const selectePath = async () => {
      const file = await dialog.showOpenDialog(getCurrentWindow(), {
        properties: ['openDirectory'],
      });
      const p = file.filePaths[0];
      if (file.canceled || !file.filePaths.length || state.storagePath === p) {
        return null;
      }
      return p;
    };

    const selectedPath = await selectePath();
    if (!selectedPath) {
      return;
    }

    if (props.authType === 'signup') {
      const date = moment().format('YYYYMMDD');
      const paths = [
        selectedPath,
        path.join(selectedPath, 'rum'),
        path.join(selectedPath, `rum-${date}`),
      ];

      for (const p of paths) {
        if (isFolderNameRum(p) && await isEmptyFolder(p)) {
          runInAction(() => {
            state.storagePath = p;
          });
          return;
        }
      }

      const files = await fs.readdir(selectedPath);
      // find the max index in `rum-${date}-${index}`
      const maxIndex = files
        .map((v) => new RegExp(`rum-${date}-(\\d+?)$`).exec(v))
        .filter(<T extends unknown>(v: T | null): v is T => !!v)
        .map((v) => Number(v[1]))
        .reduce((p, c) => Math.max(p, c), 0);
      const newPath = path.join(selectedPath, `rum-${date}-${maxIndex + 1}`);
      await fs.mkdirp(newPath);
    }

    if (props.authType === 'login') {
      const paths = [
        selectedPath,
        path.join(selectedPath, 'rum'),
      ];

      for (const p of paths) {
        if (await isRumDataFolder(p)) {
          runInAction(() => {
            state.storagePath = p;
          });
          return;
        }
      }

      snackbarStore.show({
        message: '该文件夹没有节点数据，请重新选择哦',
        type: 'error',
        duration: 4000,
      });
    }

    if (props.authType === 'external') {
      runInAction(() => {
        state.storagePath = selectedPath;
      });
    }
  };

  return (
    <div className="bg-white rounded-12 text-center p-8 w-80">
      <div className="text-18 font-bold text-gray-700">
        {props.authType === 'signup' && '创建节点'}
        {props.authType === 'login' && '登录节点'}
        {props.authType === 'external' && '外置节点选择存储目录'}
      </div>

      {!state.storagePath && (
        <div className="mt-4 text-gray-9b tracking-wide leading-loose">
          {props.authType === 'signup' && (<>
            请选择一个文件夹来储存节点数据
            <br />
            这份数据只是属于你
            <br />
            我们不会储存数据，也无法帮你找回
            <br />
            请务必妥善保管
          </>)}
          {props.authType === 'login' && (<>
            创建节点时您选择了一个文件夹
            <br />
            里面保存了您的节点信息
            <br />
            现在请重新选中该文件夹
            <br />
            以登录该节点
          </>)}
          {props.authType === 'external' && (<>
            选择外置节点数据文件的存储目录
          </>)}
        </div>
      )}

      {!state.storagePath && (
        <div className="mt-5">
          <Button fullWidth onClick={handleSelectDir}>
            选择文件夹
          </Button>
        </div>
      )}

      {state.storagePath && (
        <div>
          <div className="flex pt-8 pb-1 px-2">
            <div className="text-left p-2 pl-3 border border-gray-200 text-gray-500 bg-gray-100 text-12 truncate flex-1 rounded-l-12 border-r-0">
              <Tooltip placement="top" title={state.storagePath} arrow interactive>
                <div className="tracking-wide">
                  {formatPath(state.storagePath, { truncateLength: 19 })}
                </div>
              </Tooltip>
            </div>
            <Button
              noRound
              className="rounded-r-12 opacity-60"
              size="small"
              onClick={handleSelectDir}
            >
              修改
            </Button>
          </div>
          <div className="mt-8">
            <Button
              fullWidth
              onClick={() => props.onSelectPath(state.storagePath)}
            >
              确定
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
