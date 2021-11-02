import React from 'react';
import { observer } from 'mobx-react-lite';
import Sidebar from 'layouts/Content/Sidebar';
import Header from 'layouts/Content/Header';
import { useStore } from 'store';
import GroupApi from 'apis/group';
import UsePolling from 'hooks/usePolling';
import useAnchorClick from 'hooks/useAnchorClick';
import UseAppBadgeCount from 'hooks/useAppBadgeCount';
import useExportToWindow from 'hooks/useExportToWindow';
import Welcome from './Welcome';
import Help from 'layouts/Main/Help';
import Feed from 'layouts/Main/Feed';
import useQueryObjects from 'hooks/useQueryObjects';
import { runInAction } from 'mobx';
import useSubmitPerson from 'hooks/useSubmitPerson';
import useDatabase from 'hooks/useDatabase';
import useOffChainDatabase from 'hooks/useOffChainDatabase';
import useSetupQuitHook from 'hooks/useSetupQuitHook';
import useSetupCleanLocalData from 'hooks/useSetupCleanLocalData';
import Loading from 'components/Loading';
import Fade from '@material-ui/core/Fade';
import { ObjectsFilterType } from 'store/activeGroup';
import SidebarMenu from 'layouts/Content/Sidebar/SidebarMenu';
import BackToTop from 'components/BackToTop';
import CommentReplyModal from 'components/CommentReplyModal';
import ObjectDetailModal from 'components/ObjectDetailModal';
import * as PersonModel from 'hooks/useDatabase/models/person';
import * as globalProfileModel from 'hooks/useOffChainDatabase/models/globalProfile';
import getSortedGroups from 'store/selectors/getSortedGroups';
import useActiveGroup from 'store/selectors/useActiveGroup';

const OBJECTS_LIMIT = 20;

export default observer(() => {
  const { activeGroupStore, groupStore, nodeStore, authStore, commentStore, latestStatusStore } = useStore();
  const activeGroup = useActiveGroup();
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
  useSetupCleanLocalData();

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
          activeGroupStore.setId(firstGroup.group_id);
        }
        return;
      }

      activeGroupStore.setSwitchLoading(true);

      activeGroupStore.setObjectsFilter({
        type: ObjectsFilterType.ALL,
      });

      await activeGroupStore.fetchUnFollowings(offChainDatabase, {
        groupId: activeGroupStore.id,
        publisher: activeGroup.user_pubkey,
      });

      await Promise.all([fetchObjects(), fetchPerson()]);

      activeGroupStore.setSwitchLoading(false);

      fetchDeniedList(activeGroupStore.id);

      tryInitProfile();
    })();

    async function fetchDeniedList(groupId: string) {
      try {
        const res = await GroupApi.fetchDeniedList(groupId);
        authStore.setDeniedList(res || []);
      } catch (err) {
        console.error(err);
      }
    }

    async function tryInitProfile() {
      const groupId = activeGroupStore.id;
      try {
        const [profile, globalProfile] = await Promise.all([
          await PersonModel.getLatestProfile(database, {
            GroupId: groupId,
            Publisher: activeGroup.user_pubkey,
          }),
          await globalProfileModel.get(offChainDatabase),
        ]);

        const profileUpdateTime = profile
          ? profile.time / 1000000
          : -1;
        const globalProfileUpdateTime = globalProfile?.time ?? 0;
        const skip = !globalProfile || profileUpdateTime > globalProfileUpdateTime;

        if (skip) {
          return;
        }

        await submitPerson({
          groupId,
          publisher: activeGroup.user_pubkey,
          profile: globalProfile.profile,
        });
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
      if (groupId !== activeGroupStore.id) {
        return;
      }
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
      await database.transaction('rw', database.latestStatus, async () => {
        if (objects.length > 0) {
          const latestObject = objects[0];
          await latestStatusStore.updateMap(database, groupId, {
            latestReadTimeStamp: latestObject.TimeStamp,
          });
        }
        await latestStatusStore.updateMap(database, groupId, {
          unreadCount: 0,
        });
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchPerson() {
    try {
      const [user, latestPersonStatus] = await database.transaction(
        'r',
        database.persons,
        () => Promise.all([
          PersonModel.getUser(database, {
            GroupId: activeGroupStore.id,
            Publisher: activeGroup.user_pubkey,
          }),
          PersonModel.getLatestPersonStatus(database, {
            GroupId: activeGroupStore.id,
            Publisher: activeGroup.user_pubkey,
          }),
        ]),
      );

      activeGroupStore.setProfile(user.profile);
      activeGroupStore.updateProfileMap(activeGroup.user_pubkey, user.profile);
      activeGroupStore.setLatestPersonStatus(latestPersonStatus);
    } catch (err) {
      console.log(err);
    }
  }

  if (nodeStore.quitting) {
    return (
      <div className="flex bg-white h-full items-center justify-center">
        <Fade in={true} timeout={500}>
          <div className="-mt-12">
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
    <div className="flex bg-white items-stretch h-full">
      <Sidebar className="w-[280px] select-none z-20" />
      <div className="flex-1 bg-gray-f7 overflow-hidden">
        {activeGroupStore.isActive && (
          <div className="relative flex flex-col h-full">
            <Header />
            {!activeGroupStore.switchLoading && (
              <div className="flex-1 h-0 items-center overflow-y-auto scroll-view pt-6 relative" ref={scrollRef}>
                <SidebarMenu />
                <Feed rootRef={scrollRef} />
                <BackToTop rootRef={scrollRef} />
              </div>
            )}
          </div>
        )}
        {!activeGroupStore.isActive && (
          <div className="flex flex-center h-full tracking-widest text-18 text-gray-9b">
            {groupStore.groups.length === 0 && <Welcome />}
          </div>
        )}
      </div>
      <div className="pb-5" />

      <Help />

      <CommentReplyModal />
      <ObjectDetailModal />
    </div>
  );
});
