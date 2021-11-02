import React from 'react';
import { observer } from 'mobx-react-lite';
import Sidebar from './Sidebar';
import Header from './Header';
import { useStore } from 'store';
import GroupApi from 'apis/group';
import UsePolling from 'hooks/usePolling';
import useAnchorClick from 'hooks/useAnchorClick';
import UseAppBadgeCount from 'hooks/useAppBadgeCount';
import useExportToWindow from 'hooks/useExportToWindow';
import Welcome from './Welcome';
import Help from './Help';
import Feed from './Feed';
import useQueryObjects from 'hooks/useQueryObjects';
import { runInAction } from 'mobx';
import useSubmitPerson from 'hooks/useSubmitPerson';
import useDatabase from 'hooks/useDatabase';
import useOffChainDatabase from 'hooks/useOffChainDatabase';
import useSetupQuitHook from 'hooks/useSetupQuitHook';
import Loading from 'components/Loading';
import Fade from '@material-ui/core/Fade';
import { ObjectsFilterType } from 'store/activeGroup';
import SidebarMenu from './SidebarMenu';
import BackToTop from 'components/BackToTop';
import CommentReplyModal from 'components/CommentReplyModal';
import ObjectDetailModal from 'components/ObjectDetailModal';
import * as PersonModel from 'hooks/useDatabase/models/person';
import * as globalProfileModel from 'hooks/useOffChainDatabase/models/globalProfile';
import getSortedGroups from 'store/selectors/getSortedGroups';

const OBJECTS_LIMIT = 20;

export default observer(() => {
  const { activeGroupStore, groupStore, nodeStore, authStore, commentStore, latestStatusStore } = useStore();
  const database = useDatabase();
  const offChainDatabase = useOffChainDatabase();
  const queryObjects = useQueryObjects();
  const submitPerson = useSubmitPerson();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  UsePolling();
  useAnchorClick();
  UseAppBadgeCount();
  useExportToWindow();
  useSetupQuitHook();

  React.useEffect(() => {
    activeGroupStore.clearAfterGroupChanged();
    clearStoreData();

    (async () => {
      if (latestStatusStore.isEmpty) {
        await latestStatusStore.fetchMap(database);
      }

      if (!activeGroupStore.id) {
        if (groupStore.groups.length > 0) {
          const sortedGroups = getSortedGroups(groupStore.groups, latestStatusStore.map);
          const firstGroup = sortedGroups[0];
          activeGroupStore.setId(firstGroup.GroupId);
        }
        return;
      }

      activeGroupStore.setSwitchLoading(true);

      await activeGroupStore.fetchUnFollowings(offChainDatabase, {
        groupId: activeGroupStore.id,
        publisher: nodeStore.info.node_publickey,
      });

      await Promise.all([fetchObjects(), fetchPerson()]);

      activeGroupStore.setSwitchLoading(false);

      fetchBlacklist();

      tryInitProfile();
    })();

    async function fetchBlacklist() {
      try {
        const res = await GroupApi.fetchBlacklist();
        authStore.setBlackList(res.blocked || []);
      } catch (err) {
        console.error(err);
      }
    }

    async function tryInitProfile() {
      try {
        const hasProfile = await PersonModel.has(database, {
          GroupId: activeGroupStore.id,
          Publisher: nodeStore.info.node_publickey,
        });
        if (!hasProfile) {
          const globalProfile = await globalProfileModel.get(offChainDatabase);
          if (globalProfile) {
            const profile = await submitPerson({
              groupId: activeGroupStore.id,
              publisher: nodeStore.info.node_publickey,
              profile: globalProfile,
            });
            activeGroupStore.setProfile(profile);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
  }, [activeGroupStore.id]);

  React.useEffect(() => {
    (async () => {
      if (activeGroupStore.switchLoading || !activeGroupStore.id) {
        return;
      }
      activeGroupStore.setMainLoading(true);
      clearStoreData();
      await fetchObjects();
      activeGroupStore.setMainLoading(false);
    })();
  }, [
    activeGroupStore.objectsFilter.type,
    activeGroupStore.objectsFilter.publisher,
    activeGroupStore.searchText,
  ]);

  function clearStoreData() {
    activeGroupStore.clearObjects();
    commentStore.clear();
  }

  async function fetchObjects() {
    try {
      const groupId = activeGroupStore.id;
      const objects = await queryObjects({
        GroupId: groupId,
        limit: OBJECTS_LIMIT,
      });
      runInAction(() => {
        for (const object of objects) {
          activeGroupStore.addObject(object);
        }
        if (objects.length === OBJECTS_LIMIT) {
          activeGroupStore.setHasMoreObjects(true);
        }
        if (activeGroupStore.objectsFilter.type === ObjectsFilterType.ALL) {
          const latestStatus = latestStatusStore.map[groupId] || latestStatusStore.DEFAULT_LATEST_STATUS;
          if (latestStatus.unreadCount > 0) {
            activeGroupStore.addLatestObjectTimeStamp(
              latestStatus.latestReadTimeStamp,
            );
          }
        }
      });
      if (objects.length > 0) {
        const latestObject = objects[0];
        await latestStatusStore.updateMap(database, groupId, {
          latestReadTimeStamp: latestObject.TimeStamp,
        });
      }
      await latestStatusStore.updateMap(database, groupId, {
        unreadCount: 0,
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchPerson() {
    try {
      const user = await PersonModel.getUser(database, {
        GroupId: activeGroupStore.id,
        Publisher: nodeStore.info.node_publickey,
      });
      activeGroupStore.setProfile(user.profile);
    } catch (err) {
      console.log(err);
    }
  }

  if (nodeStore.quitting) {
    return (
      <div className="flex bg-white h-screen items-center justify-center">
        <Fade in={true} timeout={500}>
          <div className="-mt-32 -ml-6">
            <Loading />
            <div className="mt-6 text-15 text-gray-9b tracking-widest">
              节点正在退出
            </div>
          </div>
        </Fade>
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
            {!activeGroupStore.switchLoading && (
              <div className="flex flex-col items-center overflow-y-auto scroll-view pt-6" ref={scrollRef}>
                <SidebarMenu />
                <Feed rootRef={scrollRef} />
                <BackToTop elementSelector=".scroll-view" />
              </div>
            )}
            {activeGroupStore.switchLoading && (
              <Fade in={true} timeout={800}>
                <div className="pt-64">
                  <Loading size={22} />
                </div>
              </Fade>
            )}
          </div>
        )}
        {!activeGroupStore.isActive && (
          <div className="h-screen flex items-center justify-center tracking-widest text-18 text-gray-9b">
            {groupStore.groups.length === 0 && <Welcome />}
          </div>
        )}
      </div>
      <div className="pb-5" />

      <Help />

      <CommentReplyModal />
      <ObjectDetailModal />

      <style jsx>{`
        .scroll-view {
          height: calc(100vh - 52px);
        }
      `}</style>
    </div>
  );
});
