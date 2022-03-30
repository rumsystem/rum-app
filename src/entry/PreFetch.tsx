import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { useStore } from 'store';
import GroupApi from 'apis/group';
import Bootstrap from './Bootstrap';
import Loading from 'components/Loading';
import Fade from '@material-ui/core/Fade';
import sleep from 'utils/sleep';
import * as useDatabase from 'hooks/useDatabase';
import * as useOffChainDatabase from 'hooks/useOffChainDatabase';

export default observer(() => {
  const { groupStore, nodeStore } = useStore();
  const state = useLocalObservable(() => ({
    isFetched: false,
    isQuitting: false,
    showGroupEditorModal: false,
    showJoinGroupModal: false,
  }));

  React.useEffect(() => {
    (async () => {
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
        state.isFetched = true;
      } catch (err) {
        console.error(err);
      }
    })();
  }, [state]);

  if (!state.isFetched) {
    return null;
  }

  return <DatabaseSetupAndBootstrap />;
});

const DatabaseSetupAndBootstrap = observer(() => {
  const { nodeStore } = useStore();
  const state = useLocalObservable(() => ({
    canShowLoading: false,
    loading: true,
  }));

  React.useEffect(() => {
    (async () => {
      await Promise.all([
        useDatabase.init(nodeStore.info.node_publickey),
        useOffChainDatabase.init(nodeStore.info.node_publickey),
      ]);
      state.loading = false;
    })();
  }, []);

  React.useEffect(() => {
    (async () => {
      await sleep(400);
      if (state.loading) {
        state.canShowLoading = true;
      }
    })();
  }, []);

  if (state.canShowLoading && state.loading) {
    return (
      <div className="flex bg-white h-full items-center justify-center">
        <Fade in={true} timeout={1200}>
          <div className="-mt-20">
            <Loading />
          </div>
        </Fade>
      </div>
    );
  }

  if (state.loading) {
    return null;
  }

  return <Bootstrap />;
});
