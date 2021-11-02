import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Loading from 'components/Loading';
import { sleep } from 'utils';
import { useStore } from 'store';
import GroupApi from 'apis/group';
import { migrateSeed } from 'migrations/seed';
import Bootstrap from './Bootstrap';

export default observer(() => {
  const { activeGroupStore, groupStore, nodeStore } = useStore();
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
        groupStore.initElectronStore(`peer_${info.node_publickey}_group`);
        if (groups && groups.length > 0) {
          groupStore.addGroups(groups);
          const firstGroup = groupStore.groups[0];
          activeGroupStore.setId(firstGroup.GroupId);
          migrateSeed(groups);
        }
        await sleep(500);
        state.isFetched = true;
      } catch (err) {
        console.error(err);
      }
    })();
  }, [state]);

  if (!state.isFetched) {
    return (
      <div className="flex bg-white h-screen items-center justify-center">
        <div className="-mt-32 -ml-6">
          <Loading />
        </div>
      </div>
    );
  }

  return <Bootstrap />;
});
