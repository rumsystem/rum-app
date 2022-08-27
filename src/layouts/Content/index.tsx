import React from 'react';
import classNames from 'classnames';
import { runInAction, when } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Sidebar from 'layouts/Content/Sidebar';
import Header from 'layouts/Content/Header';
import { useStore } from 'store';
import DeniedListApi from 'apis/deniedList';
import UsePolling from 'hooks/usePolling';
import useAnchorClick from 'hooks/useAnchorClick';
import UseAppBadgeCount from 'hooks/useAppBadgeCount';
import useExportToWindow from 'hooks/useExportToWindow';
import Welcome from './Welcome';
import Help from 'layouts/Main/Help';
import Feed from 'layouts/Main/Feed';
import useQueryObjects from 'hooks/useQueryObjects';
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
import getSortedGroups from 'store/selectors/getSortedGroups';
import useActiveGroup from 'store/selectors/useActiveGroup';
import useCheckGroupProfile from 'hooks/useCheckGroupProfile';
import { lang } from 'utils/lang';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';

const OBJECTS_LIMIT = 20;

export default observer(() => {
  const state = useLocalObservable(() => ({
    scrollTopLoading: false,
  }));
  const { activeGroupStore, groupStore, nodeStore, authStore, commentStore, latestStatusStore } = useStore();
  const activeGroup = useActiveGroup();
  const database = useDatabase();
  const offChainDatabase = useOffChainDatabase();
  const queryObjects = useQueryObjects();
  const checkGroupProfile = useCheckGroupProfile();
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

      await Promise.all([
        (() => {
          if (activeGroup.app_key === GROUP_TEMPLATE_TYPE.TIMELINE) {
            const scrollTop = activeGroupStore.cachedScrollTops.get(activeGroupStore.id) ?? 0;
            if (scrollTop > window.innerHeight) {
              const restored = activeGroupStore.restoreCache(activeGroupStore.id);
              if (restored) {
                runInAction(() => {
                  state.scrollTopLoading = true;
                });
                when(() => !activeGroupStore.switchLoading, () => {
                  setTimeout(() => {
                    if (scrollRef.current) {
                      scrollRef.current.scrollTop = scrollTop ?? 0;
                    }
                    runInAction(() => {
                      state.scrollTopLoading = false;
                    });
                  });
                });
                return;
              }
            } else {
              activeGroupStore.clearCache(activeGroupStore.id);
            }
          }

          return fetchObjects();
        })(),
        fetchPerson(),
      ]);

      activeGroupStore.setSwitchLoading(false);

      fetchDeniedList(activeGroupStore.id);

      checkGroupProfile(activeGroupStore.id);
    })();

    async function fetchDeniedList(groupId: string) {
      try {
        const res = await DeniedListApi.fetchDeniedList(groupId);
        authStore.setDeniedList(res || []);
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

  const handleScroll = () => {
    activeGroupStore.cacheScrollTop(
      activeGroupStore.id,
      scrollRef.current?.scrollTop ?? 0,
    );
  };

  if (nodeStore.quitting) {
    return (
      <div className="flex bg-white h-full items-center justify-center">
        <Fade in={true} timeout={500}>
          <div className="-mt-12">
            <Loading />
            <div className="mt-6 text-15 text-gray-9b tracking-widest">
              {lang.exiting}
            </div>
          </div>
        </Fade>
      </div>
    );
  }

  return (
    <div className="flex bg-white items-stretch h-full">
      {groupStore.groups.length > 0 && (
        <Sidebar className="w-[280px] select-none z-20" />
      )}
      <div className="flex-1 bg-gray-f7 overflow-hidden">
        {activeGroupStore.isActive && (
          <div className="relative flex flex-col h-full">
            <Header />
            {!activeGroupStore.switchLoading && (
              <div
                className={classNames(
                  'flex-1 h-0 items-center overflow-y-auto scroll-view pt-6 relative',
                  state.scrollTopLoading && 'opacity-0',
                )}
                ref={scrollRef}
                onScroll={handleScroll}
              >
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
