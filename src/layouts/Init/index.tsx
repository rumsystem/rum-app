import React from 'react';
import fs from 'fs-extra';
import { join } from 'path';
import { app } from '@electron/remote';
import { action, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import classNames from 'classnames';

import { IconButton, Paper } from '@material-ui/core';
import { MdArrowBack } from 'react-icons/md';
import GroupApi from 'apis/group';
import NodeApi from 'apis/node';
import NetworkApi from 'apis/network';
import { useStore } from 'store';
import { BOOTSTRAPS } from 'utils/constant';
import * as Quorum from 'utils/quorum';
import sleep from 'utils/sleep';
import useCloseNode from 'hooks/useCloseNode';
import useResetNode from 'hooks/useResetNode';
import * as useDatabase from 'hooks/useDatabase';
import * as useOffChainDatabase from 'hooks/useOffChainDatabase';
import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';
import useAddGroups from 'hooks/useAddGroups';

import { NodeType } from './NodeType';
import { StoragePath } from './StoragePath';
import { StartingTips } from './StartingTips';
import { SetExternalNode } from './SetExternalNode';
import { SelectApiConfigFromHistory } from './SelectApiConfigFromHistory';
import { IApiConfig } from 'store/apiConfigHistory';
import { lang } from 'utils/lang';
import { isEmpty } from 'lodash';

import inputPassword from 'standaloneModals/inputPassword';
import { quorumInited, startQuorum } from 'utils/quorum-wasm/load-quorum';
import { WASMBootstrap } from './WASMBootstrap';
import BackgroundImage from 'assets/rum_barrel_bg.png';

enum Step {
  NODE_TYPE,
  STORAGE_PATH,

  SELECT_API_CONFIG_FROM_HISTORY,
  PROXY_NODE,

  STARTING,
  PREFETCH,

  WASM_BOOTSTRAP,
}

const backMap = {
  [Step.NODE_TYPE]: Step.NODE_TYPE,
  [Step.STORAGE_PATH]: Step.NODE_TYPE,
  [Step.SELECT_API_CONFIG_FROM_HISTORY]: Step.NODE_TYPE,
  [Step.PROXY_NODE]: Step.STORAGE_PATH,
  [Step.STARTING]: Step.STARTING,
  [Step.PREFETCH]: Step.PREFETCH,
  [Step.WASM_BOOTSTRAP]: Step.NODE_TYPE,
};

type AuthType = 'login' | 'signup' | 'proxy' | 'wasm';

interface Props {
  onInitCheckDone: () => unknown
  onInitSuccess: () => unknown
}

export const Init = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    step: Step.NODE_TYPE,
    authType: null as null | AuthType,
  }));

  const store = useStore();
  const {
    nodeStore,
    groupStore,
    confirmDialogStore,
    snackbarStore,
    apiConfigHistoryStore,
    followingStore,
    mutedListStore,
    latestStatusStore,
    betaFeatureStore,
  } = store;
  const { apiConfigHistory } = apiConfigHistoryStore;
  const addGroups = useAddGroups();
  const closeNode = useCloseNode();
  const resetNode = useResetNode();

  const initCheck = async () => {
    const check = async () => {
      if (!nodeStore.mode) {
        return false;
      }

      if (nodeStore.mode === 'INTERNAL') {
        if (!nodeStore.storagePath || !await fs.pathExists(nodeStore.storagePath)) {
          runInAction(() => { state.authType = null; state.step = Step.NODE_TYPE; });
          return false;
        }
      }

      if (nodeStore.mode === 'EXTERNAL') {
        Quorum.down();
        if (isEmpty(nodeStore.apiConfig)) {
          runInAction(() => { state.authType = null; state.step = Step.NODE_TYPE; });
          return false;
        }
        if (!nodeStore.storagePath || !await fs.pathExists(nodeStore.storagePath)) {
          runInAction(() => { state.authType = null; state.step = Step.NODE_TYPE; });
          return false;
        }
      }
      return true;
    };

    const success = await check();
    props.onInitCheckDone();
    if (success) {
      tryStartNode();
    } else {
      resetNode();
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
    await currentNodeStoreInit();
    initStoreReaction();
    const database = await dbInit();
    groupStore.appendProfile(database);
    props.onInitSuccess();
  };

  const ping = async () => {
    const getInfo = async () => {
      try {
        return {
          right: await NodeApi.fetchMyNodeInfo(),
        };
      } catch (e) {
        return {
          left: e as Error,
        };
      }
    };

    let err = new Error();
    const retries = Infinity;

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
      const result = await ping();
      if ('left' in result) {
        return result;
      }
    }
    let password = localStorage.getItem(`p${nodeStore.storagePath}`);
    let remember = false;
    if (!password) {
      ({ password, remember } = await inputPassword({ force: true, check: state.authType === 'signup' }));
    }
    const { data } = await Quorum.up({
      bootstraps: BOOTSTRAPS,
      storagePath: nodeStore.storagePath,
      password,
    });
    const status = {
      ...data,
      logs: '',
    };
    console.log('NODE_STATUS', status);
    nodeStore.setStatus(status);
    nodeStore.setApiConfig({
      port: String(status.port),
      cert: status.cert,
      host: nodeStore.apiConfig.host || '',
      jwt: nodeStore.apiConfig.jwt || '',
    });
    nodeStore.setPassword(password);

    const result = await ping();
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
        cancelText: lang.cancel,
        cancel: async () => {
          confirmDialogStore.hide();
          await closeNode();
          resetNode();
          window.location.reload();
        },
      });
    } else if (remember) {
      localStorage.setItem(`p${nodeStore.storagePath}`, password);
    }

    return result;
  };

  const startExternalNode = async () => {
    const { host, port, cert } = nodeStore.apiConfig;
    Quorum.setCert(cert);

    const result = await ping();
    if ('left' in result) {
      console.log(result.left);
      confirmDialogStore.show({
        content: lang.failToAccessExternalNode(host, port) + `<div class="text-red-400">${result.left?.message}</div>`,
        okText: lang.tryAgain,
        ok: () => {
          confirmDialogStore.hide();
          window.location.reload();
        },
        cancelText: lang.cancel,
        cancel: async () => {
          snackbarStore.show({
            message: lang.exited,
          });
          await sleep(1500);
          resetNode();
          window.location.reload();
        },
      });
    } else {
      apiConfigHistoryStore.add(nodeStore.apiConfig);
    }

    return result;
  };

  const prefetch = async () => {
    try {
      const [info, { groups }, network] = await Promise.all([
        NodeApi.fetchMyNodeInfo(),
        GroupApi.fetchMyGroups(),
        NetworkApi.fetchNetwork(),
      ]);

      nodeStore.setInfo(info);
      nodeStore.setNetwork(network);
      if (groups && groups.length > 0) {
        addGroups(groups);
      }

      return { right: null };
    } catch (e) {
      return { left: e as Error };
    }
  };

  const dbInit = async () => {
    const [_] = await Promise.all([
      useDatabase.init(nodeStore.info.node_publickey),
      useOffChainDatabase.init(nodeStore.info.node_publickey),
    ]);
    return _;
  };

  const currentNodeStoreInit = async () => {
    ElectronCurrentNodeStore.init(nodeStore.info.node_publickey);
    const dbExists = await useDatabase.exists(nodeStore.info.node_publickey);
    if (!dbExists) {
      ElectronCurrentNodeStore.getStore().clear();
    }
    groupStore.init();
    followingStore.init();
    mutedListStore.init();
    latestStatusStore.init();
    betaFeatureStore.init();
  };

  const initStoreReaction = () => {
    for (const s of Object.values(store)) {
      if (s.reaction) {
        s.reaction();
      }
    }
  };

  const handleSelectAuthType = action((v: AuthType) => {
    if (v === 'wasm') {
      state.step = Step.WASM_BOOTSTRAP;
      return;
    }
    state.authType = v;
    state.step = Step.STORAGE_PATH;
  });

  const handleSavePath = action((p: string) => {
    nodeStore.setStoragePath(p);
    if (state.authType === 'login' || state.authType === 'signup') {
      nodeStore.setMode('INTERNAL');
      tryStartNode();
    }
    if (state.authType === 'proxy') {
      if (apiConfigHistory.length > 0) {
        state.step = Step.SELECT_API_CONFIG_FROM_HISTORY;
      } else {
        state.step = Step.PROXY_NODE;
      }
    }
  });

  const handleSelectApiConfig = (config: IApiConfig) => {
    if (config) {
      nodeStore.setApiConfig(config);
    }
    state.step = Step.PROXY_NODE;
  };

  const handleSetExternalNode = (config: IApiConfig) => {
    nodeStore.setMode('EXTERNAL');
    nodeStore.setApiConfig(config);

    tryStartNode();
  };

  const handleConfirmBootstrap = async (bootstraps: Array<string>) => {
    await quorumInited;
    runInAction(() => { state.step = Step.PREFETCH; });
    await startQuorum(bootstraps);
    await prefetch();
    await currentNodeStoreInit();
    initStoreReaction();
    const database = await dbInit();
    groupStore.appendProfile(database);
    await props.onInitSuccess();
  };

  const handleBack = action(() => {
    if (state.step === Step.PROXY_NODE && apiConfigHistory.length > 0) {
      state.step = Step.SELECT_API_CONFIG_FROM_HISTORY;
      nodeStore.setApiConfig({
        host: '',
        port: '',
        jwt: '',
        cert: '',
      });
    } else {
      state.step = backMap[state.step];
    }
  });

  const canGoBack = () => state.step !== backMap[state.step];

  React.useEffect(() => {
    const isTest = !!process.env.TEST_ENV;
    if (!isTest) {
      initCheck();
    }

    if (isTest) {
      (async () => {
        runInAction(() => { state.authType = null; state.step = Step.NODE_TYPE; });
        state.authType = 'signup';
        const newPath = join(app.getPath('userData'), 'rum-user-data');
        await fs.mkdirp(newPath);
        nodeStore.setStoragePath(newPath);
        nodeStore.setMode('INTERNAL');
        localStorage.setItem(`p${nodeStore.storagePath}`, '123');
        props.onInitCheckDone();
        tryStartNode();
      })();
    }
  }, []);

  return (
    <div className="h-full">
      {[
        Step.NODE_TYPE,
        Step.STORAGE_PATH,
        Step.SELECT_API_CONFIG_FROM_HISTORY,
        Step.PROXY_NODE,
        Step.WASM_BOOTSTRAP,
      ].includes(state.step) && (
        <div
          className="bg-black bg-opacity-50 flex flex-center h-full w-full"
          style={state.step === Step.NODE_TYPE ? {
            backgroundImage: `url('${BackgroundImage}')`,
            backgroundSize: 'cover',
            backgroundAttachment: 'fixed',
            backgroundPositionX: '50%',
            backgroundPositionY: '50%',
          } : {}}
        >
          <Paper
            className={classNames(
              state.step === Step.NODE_TYPE ? 'bg-transparent shadow-0' : 'bg-white rounded-0 shadow-3 relative',
            )}
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

            {state.step === Step.NODE_TYPE && (
              <NodeType
                onSelect={handleSelectAuthType}
              />
            )}

            {state.step === Step.STORAGE_PATH && state.authType && (
              <StoragePath
                authType={state.authType as Exclude<AuthType, 'wasm'>}
                onSelectPath={handleSavePath}
              />
            )}

            {state.step === Step.SELECT_API_CONFIG_FROM_HISTORY && (
              <SelectApiConfigFromHistory
                onConfirm={handleSelectApiConfig}
              />
            )}

            {state.step === Step.PROXY_NODE && (
              <SetExternalNode
                onConfirm={handleSetExternalNode}
              />
            )}

            {state.step === Step.WASM_BOOTSTRAP && (
              <WASMBootstrap
                onConfirm={handleConfirmBootstrap}
              />
            )}
          </Paper>
        </div>
      )}

      {[Step.STARTING, Step.PREFETCH].includes(state.step) && (
        <StartingTips />
      )}
    </div>
  );
});
