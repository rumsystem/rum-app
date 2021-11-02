import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Loading from 'components/Loading';
import Button from 'components/Button';
import { sleep } from 'utils';
import Sidebar from './Sidebar';
import Header from './Header';
import Editor from './Editor';
import Contents from './Contents';
import BackToTop from 'components/BackToTop';
import { useStore } from 'store';
import GroupApi from 'apis/group';
import * as Quorum from 'utils/quorum';
import { UpParam } from 'utils/quorum';
import UsePolling from './usePolling';
import UseAppBadgeCount from './useAppBadgeCount';
import useGroupStoreKey from 'hooks/useGroupStoreKey';
import Welcome from './Welcome';

export default observer(() => {
  const { groupStore, nodeStore, authStore } = useStore();
  const groupStoreKey = useGroupStoreKey();
  const state = useLocalStore(() => ({
    isFetched: false,
    loading: false,
    showGroupEditorModal: false,
    showJoinGroupModal: false,
  }));

  UsePolling();
  UseAppBadgeCount();

  React.useEffect(() => {
    if (!groupStore.id) {
      return;
    }
    (async () => {
      state.loading = true;
      try {
        const contents = await GroupApi.fetchContents(groupStore.id, {
          minPendingDuration: 200,
        });
        groupStore.addContents(contents || []);
        groupStore.addContents(
          groupStore
            .getCachedNewContents(groupStoreKey)
            .filter((content) => !groupStore.contentMap[content.TrxId])
        );
      } catch (err) {
        console.log(err.message);
      }
      state.loading = false;

      try {
        const res = await GroupApi.fetchBlacklist();
        authStore.setBlackList(res.blocked || []);
      } catch (err) {
        console.log(err.message);
      }
    })();
  }, [groupStore.id]);

  React.useEffect(() => {
    (async () => {
      try {
        const [info, { groups }] = await Promise.all([
          GroupApi.fetchMyNodeInfo(),
          GroupApi.fetchMyGroups(),
        ]);
        nodeStore.setInfo(info);
        if (groups && groups.length > 0) {
          groupStore.addGroups(groups);
          const firstGroup = groupStore.groups[0];
          groupStore.setId(firstGroup.GroupId);
        }
        await sleep(500);
        state.isFetched = true;
      } catch (err) {
        console.log(err.message);
        if (!nodeStore.isUsingCustomPort) {
          try {
            const res = await Quorum.up(nodeStore.config as UpParam);
            console.log(res);
          } catch (err) {
            console.log(err.message);
          }
        }
      }
    })();
  }, [state]);

  const fetchContents = async () => {
    const contents = await GroupApi.fetchContents(groupStore.id);
    groupStore.addContents(contents || []);
  };

  if (!state.isFetched) {
    return (
      <div className="flex bg-white h-screen items-center justify-center">
        <div className="-mt-32 -ml-6">
          <Loading />
        </div>
      </div>
    );
  }

  const unreadCount = groupStore.unReadCountMap[groupStore.id] || 0;

  return (
    <div className="flex bg-white">
      <div className="w-[250px] border-r border-l border-gray-200 h-screen">
        <Sidebar />
      </div>
      <div className="flex-1 bg-gray-f7">
        {groupStore.isSelected && (
          <div className="h-screen">
            <Header />
            {state.loading && (
              <div className="pt-56">
                <Loading />
              </div>
            )}
            {!state.loading && (
              <div className="overflow-y-auto scroll-view">
                <div className="pt-6 flex justify-center">
                  <Editor />
                </div>
                <div className="flex justify-center pb-5 relative">
                  {unreadCount > 0 && (
                    <div className="flex justify-center absolute left-0 w-full -top-2 z-10">
                      <Button className="shadow-xl" onClick={fetchContents}>
                        有 {unreadCount} 条新内容
                      </Button>
                    </div>
                  )}
                  <Contents />
                </div>
                <BackToTop elementSelector=".scroll-view" />
              </div>
            )}
            <style jsx>{`
              .scroll-view {
                height: calc(100vh - 52px);
              }
            `}</style>
          </div>
        )}
        {!groupStore.isSelected && (
          <div className="h-screen flex items-center justify-center tracking-widest text-18 text-gray-9b">
            {groupStore.groups.length === 0 && <Welcome />}
          </div>
        )}
      </div>
    </div>
  );
});
