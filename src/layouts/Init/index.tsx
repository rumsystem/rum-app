import React from 'react';
import fs from 'fs-extra';
import { action, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import * as TE from 'fp-ts/TaskEither';
import * as E from 'fp-ts/Either';

import { IconButton, Paper } from '@material-ui/core';
import { MdArrowBack } from 'react-icons/md';
import GroupApi from 'apis/group';
import { useStore } from 'store';
import { BOOTSTRAPS } from 'utils/constant';
import * as Quorum from 'utils/quorum';
import sleep from 'utils/sleep';
import useExitNode from 'hooks/useExitNode';
import * as useDatabase from 'hooks/useDatabase';
import * as useOffChainDatabase from 'hooks/useOffChainDatabase';

import { NodeType } from './NodeType';
import { StoragePath } from './StoragePath';
import { StartingTips } from './StartingTips';
import { SetExternalNode, SetExternalNodeResponse } from './SetExternalNode/SetExternalNode';

enum Step {
  NODE_TYPE,
  STORAGE_PATH,

  EXTERNAL_NODE,

  STARTING,
  PREFETCH,
}

const backMapInternal = {
  [Step.NODE_TYPE]: Step.NODE_TYPE,
  [Step.STORAGE_PATH]: Step.NODE_TYPE,
  [Step.EXTERNAL_NODE]: Step.STORAGE_PATH,
  [Step.STARTING]: Step.STARTING,
  [Step.PREFETCH]: Step.PREFETCH,
};

const backMapExternal = {
  [Step.NODE_TYPE]: Step.NODE_TYPE,
  [Step.STORAGE_PATH]: Step.STORAGE_PATH,
  [Step.EXTERNAL_NODE]: Step.STORAGE_PATH,
  [Step.STARTING]: Step.STARTING,
  [Step.PREFETCH]: Step.PREFETCH,
};

type AuthType = 'login' | 'signup';

interface Props {
  onInitSuccess: () => unknown
}

export const Init = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    step: Step.NODE_TYPE,
    authType: null as null | AuthType,
  }));

  const {
    nodeStore,
    groupStore,
    confirmDialogStore,
    snackbarStore,
  } = useStore();
  const exitNode = useExitNode();

  const initCheck = async () => {
    if (nodeStore.mode === 'INTERNAL') {
      if (!nodeStore.storagePath || !await fs.pathExists(nodeStore.storagePath)) {
        runInAction(() => { state.step = Step.NODE_TYPE; });
        return;
      }
    }

    if (nodeStore.mode === 'EXTERNAL') {
      Quorum.down();
      if (!nodeStore.storagePath || !await fs.pathExists(nodeStore.storagePath)) {
        runInAction(() => { state.step = Step.STORAGE_PATH; });
        return;
      }
      if (!nodeStore.apiHost || !nodeStore.port) {
        runInAction(() => { state.step = Step.EXTERNAL_NODE; });
        return;
      }
    }

    tryStartNode();
  };

  const tryStartNode = async () => {
    runInAction(() => { state.step = Step.STARTING; });
    const result = nodeStore.mode === 'INTERNAL'
      ? await startInternalNode()
      : await startExternalNode();

    if (E.isLeft(result)) {
      return;
    }

    runInAction(() => { state.step = Step.PREFETCH; });
    await Promise.all([
      prefetch(),
      dbInit(),
    ]);

    props.onInitSuccess();
  };

  const ping = async (retries = 6) => {
    const getInfo = TE.tryCatch(
      () => GroupApi.fetchMyNodeInfo(),
      (e) => e as Error,
    );

    let result: E.Either<Error, unknown> = E.left(new Error());

    for (let i = 0; i < retries; i += 1) {
      result = await getInfo();
      if (E.isRight(result)) {
        return result;
      }
    }

    return result;
  };

  const startInternalNode = async () => {
    const { data: status } = await Quorum.up({
      host: BOOTSTRAPS[0].host,
      bootstrapId: BOOTSTRAPS[0].id,
      storagePath: nodeStore.storagePath,
    });
    console.log('NODE_STATUS', status);
    nodeStore.setStatus(status);
    nodeStore.setPort(status.port);
    nodeStore.resetApiHost();

    const result = await ping(30);
    if (E.isLeft(result)) {
      console.error(result.left);
      confirmDialogStore.show({
        content: '群组没能正常启动，请再尝试一下',
        okText: '重新启动',
        ok: () => {
          confirmDialogStore.hide();
          window.location.reload();
        },
        cancelText: '切换节点',
        cancel: async () => {
          confirmDialogStore.hide();
          // modalStore.pageLoading.show();
          nodeStore.setStoragePath('');
          // await sleep(400);
          await exitNode();
          // await sleep(300);
          window.location.reload();
        },
      });
    }

    return result;
  };

  const startExternalNode = async () => {
    const host = nodeStore.storeApiHost || nodeStore.apiHost;
    const port = nodeStore.port;
    const cert = nodeStore.cert;
    Quorum.setCert(cert);

    const result = await ping();
    if (E.isLeft(result)) {
      console.log(result.left);
      confirmDialogStore.show({
        content: `开发节点无法访问，请检查一下<br />${host}:${port}`,
        okText: '再次尝试',
        ok: () => {
          confirmDialogStore.hide();
          window.location.reload();
        },
        cancelText: '重置',
        cancel: async () => {
          snackbarStore.show({
            message: '重置成功',
          });
          await sleep(1500);
          nodeStore.resetElectronStore();
          nodeStore.setMode('EXTERNAL');
          window.location.reload();
        },
      });
    }

    return result;
  };

  const prefetch = TE.tryCatch(
    async () => {
      const [info, { groups }, network] = await Promise.all([
        GroupApi.fetchMyNodeInfo(),
        GroupApi.fetchMyGroups(),
        GroupApi.fetchNetwork(),
      ]);

      nodeStore.setInfo(info);
      nodeStore.setNetwork(network);
      if (groups && groups.length > 0) {
        groupStore.addGroups(groups);
      }
    },
    (v) => v as Error,
  );

  const dbInit = async () => {
    await Promise.all([
      useDatabase.init(nodeStore.info.node_publickey),
      useOffChainDatabase.init(nodeStore.info.node_publickey),
    ]);
  };

  const handleSelectAuthType = action((v: AuthType) => {
    state.authType = v;
    state.step = Step.STORAGE_PATH;
  });

  const handleSavePath = action((p: string) => {
    nodeStore.setStoragePath(p);
    if (nodeStore.mode === 'INTERNAL') {
      tryStartNode();
    }
    if (nodeStore.mode === 'EXTERNAL') {
      state.step = Step.EXTERNAL_NODE;
    }
  });

  const handleSetExternalNode = (v: SetExternalNodeResponse) => {
    nodeStore.setMode('EXTERNAL');
    nodeStore.setJWT(v.jwt);
    nodeStore.setPort(v.port);
    nodeStore.setCert(v.cert);
    nodeStore.setApiHost(v.host);

    tryStartNode();
  };

  const handleBack = action(() => {
    if (state.step === Step.NODE_TYPE) {
      return;
    }
    const backMap = nodeStore.mode === 'INTERNAL'
      ? backMapInternal
      : backMapExternal;

    state.step = backMap[state.step];
  });

  const canGoBack = () => {
    const backMap = nodeStore.mode === 'INTERNAL'
      ? backMapInternal
      : backMapExternal;
    return backMap[state.step] !== state.step;
  };

  React.useEffect(() => {
    initCheck();
  }, []);

  return (
    <div className="h-full">
      {[Step.NODE_TYPE, Step.STORAGE_PATH, Step.EXTERNAL_NODE].includes(state.step) && (
        <div className="bg-black bg-opacity-50 flex flex-center h-full w-full">
          <Paper
            className="bg-white rounded-lg shadow-3 relative"
            elevation={3}
          >
            {canGoBack() && (
              <IconButton
                className="absolute top-0 left-0 ml-2 mt-2"
                onClick={handleBack}
              >
                <MdArrowBack />
              </IconButton>
            )}
            {nodeStore.mode === 'INTERNAL' && (<>
              {state.step === Step.NODE_TYPE && (
                <NodeType
                  onSelect={handleSelectAuthType}
                />
              )}

              {state.step === Step.STORAGE_PATH && !!state.authType && (
                <StoragePath
                  authType={state.authType}
                  onSelectPath={handleSavePath}
                />
              )}
            </>)}
            {nodeStore.mode === 'EXTERNAL' && (<>
              {state.step === Step.STORAGE_PATH && (
                <StoragePath
                  authType="external"
                  onSelectPath={handleSavePath}
                />
              )}

              {state.step === Step.EXTERNAL_NODE && (
                <SetExternalNode
                  onConfirm={handleSetExternalNode}
                />
              )}
            </>)}
          </Paper>
        </div>
      )}

      {[Step.STARTING, Step.PREFETCH].includes(state.step) && (
        <StartingTips />
      )}
    </div>
  );
});
