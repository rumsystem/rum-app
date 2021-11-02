import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Loading from 'components/Loading';
import { sleep } from 'utils';
import Sidebar from './Sidebar';
import Header from './Header';
import { useStore } from 'store';
import GroupApi from 'apis/group';
import UsePolling from './hooks/usePolling';
import useAnchorClick from './hooks/useAnchorClick';
import UseAppBadgeCount from './hooks/useAppBadgeCount';
import Welcome from './Welcome';
import Help from './Help';
import Main from './Main';
import { intersection } from 'lodash';
import { migrateSeed } from 'migrations/seed';
import electronStoreName from 'utils/storages/electronStoreName';

export default observer(() => {
  const { activeGroupStore, groupStore, nodeStore, authStore, profileStore } =
    useStore();
  const state = useLocalObservable(() => ({
    isFetched: false,
    loading: false,
    isQuitting: false,
    showGroupEditorModal: false,
    showJoinGroupModal: false,
  }));

  UsePolling();
  useAnchorClick();
  UseAppBadgeCount();

  React.useEffect(() => {
    if (!activeGroupStore.id) {
      return;
    }

    profileStore.initElectronStore(
      electronStoreName.get({
        peerId: nodeStore.info.node_id,
        groupId: activeGroupStore.id,
        resource: 'profiles',
      })
    );

    (async () => {
      state.loading = true;
      try {
        syncGroup(activeGroupStore.id);

        const resContents = await GroupApi.fetchContents(activeGroupStore.id);

        if (groupStore.unReadCountMap[activeGroupStore.id] > 0) {
          const timeStamp =
            groupStore.latestContentTimeStampMap[activeGroupStore.id];
          activeGroupStore.addLatestContentTimeStamp(timeStamp);
        }

        const contents = [
          ...(resContents || []),
          ...activeGroupStore.pendingContents,
        ].sort((a, b) => b.TimeStamp - a.TimeStamp);

        activeGroupStore.addContents(contents);

        if (contents.length > 0) {
          const latestContent = contents[0];
          const earliestContent = contents[activeGroupStore.contentTotal - 1];
          groupStore.setLatestContentTimeStamp(
            activeGroupStore.id,
            latestContent.TimeStamp
          );
          activeGroupStore.setRearContentTimeStamp(earliestContent.TimeStamp);
        }

        groupStore.updateUnReadCountMap(activeGroupStore.id, 0);

        tryRemovePendingContents();
      } catch (err) {
        console.error(err);
      }
      state.loading = false;

      try {
        const res = await GroupApi.fetchBlacklist();
        authStore.setBlackList(res.blocked || []);
      } catch (err) {
        console.error(err);
      }
    })();

    async function syncGroup(groupId: string) {
      try {
        await GroupApi.syncGroup(groupId);
      } catch (err) {
        console.log(err);
      }
    }

    function tryRemovePendingContents() {
      activeGroupStore.deletePendingContents(
        intersection(
          activeGroupStore.contentTrxIds,
          activeGroupStore.pendingContentTxIds
        )
      );
    }
  }, [activeGroupStore.id]);

  React.useEffect(() => {
    (async () => {
      try {
        const [info, { groups }, network] = await Promise.all([
          GroupApi.fetchMyNodeInfo(),
          GroupApi.fetchMyGroups(),
          GroupApi.fetchNetwork(),
        ]);

        groupStore.initElectronStore(`peer_${info.node_id}_group`);
        activeGroupStore.initElectronStore(`peer_${info.node_id}_group`);

        nodeStore.setInfo(info);
        nodeStore.setNetwork(network);
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

  return (
    <div className="flex bg-white">
      <div className="w-[250px] border-r border-gray-200 h-screen select-none">
        <Sidebar />
      </div>
      <div className="flex-1 bg-gray-f7">
        {activeGroupStore.isActive && (
          <div className="h-screen">
            <Header />
            {!state.loading && <Main />}
          </div>
        )}
        {!activeGroupStore.isActive && (
          <div className="h-screen flex items-center justify-center tracking-widest text-18 text-gray-9b">
            {groupStore.groups.length === 0 && <Welcome />}
          </div>
        )}
      </div>
      <Help />
    </div>
  );
});
