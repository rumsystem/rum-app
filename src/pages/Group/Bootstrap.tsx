import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Loading from 'components/Loading';
import { sleep } from 'utils';
import Sidebar from './Sidebar';
import Header from './Header';
import Editor from './Editor';
import Contents from './Contents';
import BackToTop from 'components/BackToTop';
import { useStore } from 'store';
import GroupApi from 'apis/group';
import UsePolling from './usePolling';
import useAnchorClick from 'pages/Group/useAnchorClick';
import UseAppBadgeCount from './useAppBadgeCount';
import Welcome from './Welcome';
import Help from './Help';
import Fade from '@material-ui/core/Fade';

export default observer(() => {
  const { groupStore, nodeStore, authStore } = useStore();
  const state = useLocalStore(() => ({
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
    if (!groupStore.id) {
      return;
    }

    (async () => {
      state.loading = true;
      try {
        const resContents = await GroupApi.fetchContents(groupStore.id);

        if (groupStore.unReadCountMap[groupStore.id] > 0) {
          const timeStamp =
            groupStore.groupsLatestContentTimeStampMap[groupStore.id];
          groupStore.addCurrentGroupLatestContentTimeStamp(timeStamp);
        }

        const contents = [
          ...(resContents || []),
          ...groupStore.getFailedContents(),
        ].sort((a, b) => b.TimeStamp - a.TimeStamp);

        groupStore.addContents(contents);

        if (contents.length > 0) {
          const latestContent = contents[0];
          const earliestContent = contents[groupStore.contentTotal - 1];
          groupStore.setLatestContentTimeStamp(
            groupStore.id,
            latestContent.TimeStamp
          );
          groupStore.setCurrentGroupEarliestContentTimeStamp(
            earliestContent.TimeStamp
          );
        }

        groupStore.updateUnReadCountMap(groupStore.id, 0);
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
  }, [groupStore.id]);

  React.useEffect(() => {
    (async () => {
      try {
        const [info, { groups }, network] = await Promise.all([
          GroupApi.fetchMyNodeInfo(),
          GroupApi.fetchMyGroups(),
          GroupApi.fetchNetwork(),
        ]);

        groupStore.initElectronStore(`peer_${info.user_id}_group`);

        nodeStore.setInfo(info);
        nodeStore.setNetwork(network);
        if (groups && groups.length > 0) {
          groupStore.addGroups(groups);
          const firstGroup = groupStore.groups[0];
          groupStore.setId(firstGroup.GroupId);
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
      <div className="w-[250px] border-r border-l border-gray-200 h-screen">
        <Sidebar />
      </div>
      <div className="flex-1 bg-gray-f7">
        {groupStore.isSelected && (
          <div className="h-screen">
            <Header />
            {state.loading && <div className="pt-56">{/* <Loading /> */}</div>}
            {!state.loading && (
              <div className="flex flex-col items-center overflow-y-auto scroll-view">
                <Fade in={true} timeout={500}>
                  <div className="pt-6 flex justify-center">
                    <Editor />
                  </div>
                </Fade>
                <Contents />
                <div className="pb-5" />
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
      <Help />
    </div>
  );
});
