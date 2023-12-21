import path from 'path';
import React from 'react';
import fs from 'fs-extra';
import { runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { dialog, getCurrentWindow } from '@electron/remote';
import { Tooltip } from '@material-ui/core';

import { useStore } from 'store';
import Button from 'components/Button';
import formatPath from 'utils/formatPath';
import { format } from 'date-fns';
import { lang } from 'utils/lang';

interface Props {
  authType: 'login' | 'signup' | 'proxy'
  onSelectPath: (p: string) => unknown
}

export const StoragePath = observer((props: Props) => {
  const { snackbarStore } = useStore();
  const state = useLocalObservable(() => ({
    storagePath: '',
  }));

  const handleSelectDir = async () => {
    const isRumFolder = (p: string) => {
      const folderName = path.basename(p);
      return /^rum(-.+)?$/.test(folderName);
    };
    const isEmptyFolder = async (p: string) => {
      const exist = await (async () => {
        try {
          const stat = await fs.stat(p);
          return { right: stat };
        } catch (e) {
          return { left: e as NodeJS.ErrnoException };
        }
      })();
      const files = await (async () => {
        try {
          const f = await fs.readdir(p);
          return { right: f };
        } catch (e) {
          return { left: e as NodeJS.ErrnoException };
        }
      })();
      const notExist = !!exist.left && exist.left.code === 'ENOENT';
      const isEmpty = !!files.right && !files.right.length;
      return notExist || isEmpty;
    };
    const isRumDataFolder = async (p: string) => {
      const stat = await (async () => {
        try {
          const stat = await fs.stat(p);
          return { right: stat };
        } catch (e) {
          return { left: e as NodeJS.ErrnoException };
        }
      })();

      if (stat.left || !stat.right.isDirectory()) {
        return false;
      }
      const files = await fs.readdir(p);
      return files.some((v) => v === 'peerConfig');
    };
    const includeKeystoreFolder = async (p: string) => {
      const files = await fs.readdir(p);
      return files.some((v) => v === 'keystore');
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
      const date = format(new Date(), 'yyyyMMdd');
      const paths = [
        selectedPath,
        path.join(selectedPath, 'rum'),
        path.join(selectedPath, `rum-${date}`),
      ];

      for (const p of paths) {
        if (isRumFolder(p) && await isEmptyFolder(p)) {
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
      runInAction(() => {
        state.storagePath = newPath;
      });
    }

    if (props.authType === 'login') {
      const paths = [
        selectedPath,
        path.join(selectedPath, 'rum'),
      ];

      let noKeystoreFolder = false;

      for (const p of paths) {
        if (await isRumDataFolder(p)) {
          if (await includeKeystoreFolder(p)) {
            runInAction(() => {
              state.storagePath = p;
            });
            return;
          }
          noKeystoreFolder = true;
        }
      }

      snackbarStore.show({
        message: noKeystoreFolder ? lang.keyStoreNotExist : lang.nodeDataNotExist,
        type: 'error',
        duration: 4000,
      });
    }

    if (props.authType === 'proxy') {
      runInAction(() => {
        state.storagePath = selectedPath;
      });
    }
  };

  return (
    <div className="bg-white rounded-0 text-center p-8 w-80">
      <div className="text-18 font-bold text-gray-700">
        {props.authType === 'signup' && lang.signupNode}
        {props.authType === 'login' && lang.loginNode}
        {props.authType === 'proxy' && lang.externalNode}
      </div>

      {!state.storagePath && (
        <div className="mt-4 text-gray-9b tracking-wide leading-loose">
          {props.authType === 'signup' && (<>
            {lang.storagePathTip1}
            <br />
            {lang.storagePathTip2}
            <br />
            {lang.storagePathTip3}
            <br />
            {lang.storagePathTip4}
          </>)}
          {props.authType === 'login' && (<>
            {lang.storagePathLoginTip1}
            <br />
            {lang.storagePathLoginTip2}
            <br />
            {lang.storagePathLoginTip3}
            <br />
            {lang.storagePathLoginTip4}
          </>)}
          {props.authType === 'proxy' && (<>
            {lang.selectExternalNodeStoragePathTip1}
            <br />
            {lang.selectExternalNodeStoragePathTip2}
          </>)}
        </div>
      )}

      {!state.storagePath && (
        <div className="mt-5">
          <Button fullWidth onClick={handleSelectDir}>
            {lang.selectFolder}
          </Button>
        </div>
      )}

      {state.storagePath && (
        <div>
          <div className="flex pt-8 pb-1 px-2">
            <div className="text-left p-2 pl-3 border border-gray-200 text-gray-500 bg-gray-100 text-12 truncate flex-1 border-r-0">
              <Tooltip placement="top" title={state.storagePath} arrow interactive>
                <div className="tracking-wide">
                  {formatPath(state.storagePath, { truncateLength: 19 })}
                </div>
              </Tooltip>
            </div>
            <Button
              className="rounded-r-12 opacity-60"
              size="small"
              onClick={handleSelectDir}
            >
              {lang.edit}
            </Button>
          </div>
          <div className="mt-8">
            <Button
              fullWidth
              onClick={() => props.onSelectPath(state.storagePath)}
            >
              {lang.yes}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});
