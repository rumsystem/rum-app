import React from 'react';
import fs from 'fs-extra';
import { action, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';

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
import { lang } from 'utils/lang';

import inputPassword from 'standaloneModals/inputPassword';

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
  onInitCheckDone: () => unknown
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
    const check = async () => {
      if (nodeStore.mode === 'INTERNAL') {
        if (!nodeStore.storagePath || !await fs.pathExists(nodeStore.storagePath)) {
          runInAction(() => { state.step = Step.NODE_TYPE; });
          return false;
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
          return false;
        }
      }
      return true;
    };

    const success = await check();
    props.onInitCheckDone();
    if (success) {
      tryStartNode();
    }
  };

  const tryStartNode = async () => {
    runInAction(() => { state.step = Step.STARTING; });
    const result = nodeStore.mode === 'INTERNAL'
      ? await startInternalNode()
      : await startExternalNode();

    if ('left' in result) {
      return;
    }

    runInAction(() => { state.step = Step.PREFETCH; });
    await prefetch();
    await dbInit();

    props.onInitSuccess();
  };

  const ping = async (retries = 6) => {
    const getInfo = async () => {
      try {
        return {
          right: await GroupApi.fetchMyNodeInfo(),
        };
      } catch (e) {
        return {
          left: e as Error,
        };
      }
    };

    let err = new Error();

    for (let i = 0; i < retries; i += 1) {
      const getInfoPromise = getInfo();
      // await at least 1 sec
      await Promise.all([
        getInfoPromise,
        sleep(1000),
      ]);
      const result = await getInfoPromise;
      if ('right' in result) {
        return result;
      }
      const { data } = await Quorum.getLogs();
      if (data.logs.includes('incorrect passphrase') || data.logs.includes('could not decrypt key with given password')) {
        return { left: new Error('incorrect password') };
      }
      err = result.left;
    }

    return { left: err };
  };

  const startInternalNode = async () => {
    if (nodeStore.status.up) {
      const result = await ping(30);
      if ('left' in result) {
        return result;
      }
    }
    let password = localStorage.getItem(`p${nodeStore.storagePath}`);
    let remember = false;
    if (!password) {
      ({ password, remember } = await inputPassword({ force: true, check: state.authType === 'signup' }));
    }
    const { data: status } = await Quorum.up({
      host: BOOTSTRAPS[0].host,
      bootstrapId: BOOTSTRAPS[0].id,
      storagePath: nodeStore.storagePath,
      password,
    });
    console.log('NODE_STATUS', status);
    nodeStore.setStatus(status);
    nodeStore.setPort(status.port);
    nodeStore.resetApiHost();

    const result = await ping(100);
    if ('left' in result) {
      console.error(result.left);
      const passwordFailed = result?.left?.message.includes('incorrect password');
      confirmDialogStore.show({
        content: passwordFailed ? lang.invalidPassword : lang.failToStartNode,
        okText: passwordFailed ? lang.reEnter : lang.reload,
        ok: () => {
          confirmDialogStore.hide();
          window.location.reload();
        },
        cancelText: lang.exitNode,
        cancel: async () => {
          confirmDialogStore.hide();
          nodeStore.setStoragePath('');
          await exitNode();
          window.location.reload();
        },
      });
    } else if (remember) {
      localStorage.setItem(`p${nodeStore.storagePath}`, password);
    }

    return result;
  };

  const startExternalNode = async () => {
    const host = nodeStore.storeApiHost || nodeStore.apiHost;
    const port = nodeStore.port;
    const cert = nodeStore.cert;
    Quorum.setCert(cert);

    const result = await ping();
    if ('left' in result) {
      console.log(result.left);
      confirmDialogStore.show({
        content: lang.failToAccessExternalNode(host, port),
        okText: lang.tryAgain,
        ok: () => {
          confirmDialogStore.hide();
          window.location.reload();
        },
        cancelText: lang.reset,
        cancel: async () => {
          snackbarStore.show({
            message: lang.hasReset,
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

  const prefetch = async () => {
    try {
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

      return { right: null };
    } catch (e) {
      return { left: e as Error };
    }
  };

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
