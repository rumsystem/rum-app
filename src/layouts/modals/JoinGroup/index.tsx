import React from 'react';
import { promises as fs } from 'fs';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';
import { shell, dialog, getCurrentWindow } from '@electron/remote';
import { FiExternalLink } from 'react-icons/fi';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { OutlinedInput } from '@material-ui/core';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { useStore } from 'store';
import GroupApi from 'apis/group';
import sleep from 'utils/sleep';
import { action, reaction, runInAction } from 'mobx';
import useFetchGroups from 'hooks/useFetchGroups';

export const JoinGroup = observer(() => {
  const state = useLocalObservable(() => ({
    loading1: false,
    loading2: false,
    seed: '',
    seedFile: '',

    get seedValid() {
      const result = E.tryCatch(
        () => JSON.parse(state.seed),
        (v) => v,
      );

      return E.isRight(result)
        && typeof result.right === 'object'
        && !Array.isArray(result.right);
    },
  }));
  const {
    snackbarStore,
    activeGroupStore,
    seedStore,
    nodeStore,
    modalStore,
  } = useStore();
  const fetchGroups = useFetchGroups();

  const handleSelectFile = async () => {
    if (state.loading2) {
      return;
    }

    const file = await dialog.showOpenDialog(getCurrentWindow(), {
      filters: [{ name: 'json', extensions: ['json'] }],
      properties: ['openFile'],
    });
    if (file.canceled && !file.filePaths.length) {
      return;
    }

    const seed = await TE.tryCatch(
      () => fs.readFile(
        file.filePaths[0].toString(),
        'utf8',
      ),
      (v) => v as Error,
    )();

    if (E.isLeft(seed)) {
      console.error(seed.left);
      snackbarStore.show({
        message: '貌似出错了',
        type: 'error',
      });
      return;
    }
    runInAction(() => {
      state.loading2 = true;
    });
    joinGroup(seed.right).finally(() => {
      runInAction(() => {
        state.loading2 = false;
      });
    });
  };

  const handleInputConfirm = () => {
    if (state.loading1) {
      return;
    }
    runInAction(() => {
      state.loading1 = true;
    });
    joinGroup(state.seed).finally(() => {
      runInAction(() => {
        state.loading1 = false;
      });
    });
  };

  const joinGroup = async (seedString: string) => {
    const seed = E.tryCatch(
      () => JSON.parse(seedString),
      (v) => v as Error,
    );

    if (E.isLeft(seed)) {
      console.error(seed.left);
      snackbarStore.show({
        message: '种子文件有错误',
        type: 'error',
      });
      return;
    }

    try {
      await GroupApi.joinGroup(seed.right);
      await sleep(500);
      await seedStore.addSeed(
        nodeStore.storagePath,
        seed.right.group_id,
        seed.right,
      );
      await fetchGroups();
      activeGroupStore.setId(seed.right.group_id);
      snackbarStore.show({
        message: '已加入',
      });
      modalStore.joinGroup.close();
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('existed')) {
        snackbarStore.show({
          message: '你已经是这个群组的成员',
          type: 'error',
        });
        return;
      }
      snackbarStore.show({
        message: '貌似出错了',
        type: 'error',
      });
    }
  };

  React.useEffect(() => reaction(
    () => modalStore.joinGroup.show,
    action(() => {
      if (modalStore.joinGroup.show) {
        state.loading1 = false;
        state.loading2 = false;
        state.seed = '';
        state.seedFile = '';
      }
    }),
  ), []);

  return (
    <Dialog
      open={modalStore.joinGroup.show}
      maxWidth={false}
      onClose={() => modalStore.joinGroup.close()}
      transitionDuration={300}
    >
      <div className="bg-white rounded-12 text-center py-12 px-20">
        <div className="text-24 font-medium text-gray-4a">
          加入群组
        </div>
        <div className="flex items-center gap-x-9 mt-10">
          <OutlinedInput
            className="flex-1 w-90"
            classes={{
              input: 'p-4 text-gray-bf focus:text-gray-70 text-16',
            }}
            placeholder="在这里粘贴种子"
            value={state.seed}
            onChange={action((e) => { state.seed = e.target.value; })}
            spellCheck={false}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !state.seedValid) {
                handleInputConfirm();
              }
            }}
          />

          <Button
            onClick={handleInputConfirm}
            disabled={!state.seedValid}
            isDoing={state.loading1}
          >
            <div className="text-20 px-12 py-1">
              确定
            </div>
          </Button>
        </div>

        <div className="flex items-center mt-12">
          <div className="border-b border-gray-c4 flex-1" />
          <div className="text-18 text-gray-9b mx-2">
            或者上传种子文件
          </div>
          <div className="border-b flex-1" />
        </div>


        <Button
          className="mt-10"
          onClick={handleSelectFile}
          isDoing={state.loading2}
        >
          <div className="text-20 px-16 py-1">
            上传种子文件
          </div>
        </Button>

        <div className="mt-12">
          <a
            className="text-link-blue inline-flex flex-center text-18"
            href=""
            onClick={() => shell.openExternal('https://docs.prsdev.club/#/rum-app/')}
          >
            有哪些公开的群组可以加入？
            <FiExternalLink />
          </a>
        </div>
      </div>
    </Dialog>
  );
});
