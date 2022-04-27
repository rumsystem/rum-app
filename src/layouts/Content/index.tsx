import React from 'react';
import classNames from 'classnames';
import { runInAction, when } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Sidebar from 'layouts/Content/Sidebar';
import Header from 'layouts/Content/Header';
import { useStore } from 'store';
import UsePolling from 'hooks/usePolling';
import UseChecking from 'hooks/useChecking';
import useAnchorClick from 'hooks/useAnchorClick';
import UseAppBadgeCount from 'hooks/useAppBadgeCount';
import useExportToWindow from 'hooks/useExportToWindow';
import Welcome from './Welcome';
import Feed from 'layouts/Main/Feed';
import useQueryObjects from 'hooks/useQueryObjects';
import useDatabase from 'hooks/useDatabase';
import useSetupQuitHook from 'hooks/useSetupQuitHook';
import Loading from 'components/Loading';
import Fade from '@material-ui/core/Fade';
import { ObjectsFilterType } from 'store/activeGroup';
import CommentReplyModal from 'components/CommentReplyModal';
import * as PersonModel from 'hooks/useDatabase/models/person';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { lang } from 'utils/lang';
import { GROUP_TEMPLATE_TYPE } from 'apis/group';
import * as MainScrollView from 'utils/mainScrollView';
import sleep from 'utils/sleep';
import PaidRequirement from './PaidRequirement';
import useCheckPrivatePermission from 'hooks/useCheckPrivatePermission';
import usePollingPermission from './usePollingPermission';
import getLatestObject from 'store/selectors/getLatestObject';

const OBJECTS_LIMIT = 10;

export default observer(() => {
  const state = useLocalObservable(() => ({
    invisibleOverlay: false,
  }));
  const store = useStore();
  const {
    activeGroupStore,
    groupStore,
    nodeStore,
    commentStore,
    latestStatusStore,
    sidebarStore,
  } = store;
  const activeGroup = useActiveGroup();
  const database = useDatabase();
  const queryObjects = useQueryObjects();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const checkPrivatePermission = useCheckPrivatePermission();
  const pollingPermission = usePollingPermission();

  UsePolling();
  UseChecking();
  useAnchorClick();
  UseAppBadgeCount();
  useExportToWindow();
  useSetupQuitHook();

  React.useEffect(() => {
    let timer: NodeJS.Timer;
    (async () => {
      activeGroupStore.clearAfterGroupChanged();
      clearStoreData();

      if (!activeGroupStore.id) {
        if (groupStore.topGroups.length > 0) {
          const { defaultGroupFolder } = sidebarStore;
          const firstGroup = groupStore.topGroups[0];
          activeGroupStore.setId(defaultGroupFolder && defaultGroupFolder.items[0] && groupStore.map[defaultGroupFolder.items[0]] ? defaultGroupFolder.items[0] : firstGroup.group_id);
        }
        return;
      }

      activeGroupStore.setSwitchLoading(true);

      const hasPermission = await checkPrivatePermission(activeGroup);
      if (!hasPermission) {
        activeGroupStore.setPaidRequired(true);
        activeGroupStore.setSwitchLoading(false);
        fetchPerson();
        timer = pollingPermission();
        return;
      }

      activeGroupStore.setObjectsFilter({
        type: ObjectsFilterType.ALL,
      });

      (async () => {
        let hasRestoredCache = false;
        if (activeGroup.app_key === GROUP_TEMPLATE_TYPE.TIMELINE) {
          const scrollTop = activeGroupStore.cachedScrollTops.get(activeGroupStore.id) ?? 0;
          if (scrollTop > window.innerHeight) {
            const restored = activeGroupStore.restoreCache(activeGroupStore.id);
            if (restored) {
              hasRestoredCache = true;
              await sleep(1);
              runInAction(() => {
                state.invisibleOverlay = true;
              });
              when(() => !activeGroupStore.switchLoading, () => {
                setTimeout(() => {
                  if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollTop ?? 0;
                  }
                  runInAction(() => {
                    state.invisibleOverlay = false;
                  });
                });
              });
            }
          } else {
            activeGroupStore.clearCache(activeGroupStore.id);
          }
        }

        if (!hasRestoredCache) {
          const objects = await fetchObjects();
          const shouldShowImageSmoothly = activeGroup.app_key === GROUP_TEMPLATE_TYPE.TIMELINE
          && objects.slice(0, 5).some((object) => !!object.Content.image);
          if (shouldShowImageSmoothly) {
            runInAction(() => {
              state.invisibleOverlay = true;
            });
            setTimeout(() => {
              runInAction(() => {
                state.invisibleOverlay = false;
              });
            });
          }
        }

        fetchPerson();

        activeGroupStore.setSwitchLoading(false);
      })();
    })();

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
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
    activeGroupStore.objectsFilter.order,
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
        order: activeGroupStore.objectsFilter.order,
      });
      if (groupId !== activeGroupStore.id) {
        return [];
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
      if (objects.length > 0) {
        const latestObject = getLatestObject(store);
        if (latestObject) {
          latestStatusStore.update(groupId, {
            latestReadTimeStamp: latestObject.TimeStamp,
          });
        }
      }
      latestStatusStore.update(groupId, {
        unreadCount: 0,
      });
      return objects;
    } catch (err) {
      console.error(err);
    }
    return [];
  }

  async function fetchPerson() {
    try {
      const [user] = await database.transaction(
        'r',
        database.persons,
        () => Promise.all([
          PersonModel.getUser(database, {
            GroupId: activeGroupStore.id,
            Publisher: activeGroup.user_pubkey,
          }),
        ]),
      );

      activeGroupStore.setProfile(user.profile);
      activeGroupStore.updateProfileMap(activeGroup.user_pubkey, user.profile);
      groupStore.updateProfile(database, activeGroupStore.id);
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
      {groupStore.topGroups.length > 0 && (
        <Sidebar className="select-none z-20" />
      )}
      <div className="flex-1 bg-gray-f7 overflow-hidden">
        {activeGroupStore.isActive && (
          <div className="relative flex flex-col h-full">
            <Header />
            {!activeGroupStore.switchLoading && !activeGroupStore.paidRequired && (
              <div
                className={classNames(
                  `flex-1 h-0 items-center overflow-y-auto pt-6 relative ${MainScrollView.className}`,
                  state.invisibleOverlay && 'opacity-0',
                )}
                ref={scrollRef}
                onScroll={handleScroll}
              >
                <Feed rootRef={scrollRef} />
              </div>
            )}
            {!activeGroupStore.switchLoading && activeGroupStore.paidRequired && (
              <PaidRequirement />
            )}
          </div>
        )}
        {!activeGroupStore.isActive && (
          <div className="flex flex-center h-full tracking-widest text-18 text-gray-9b">
            {groupStore.topGroups.length === 0 && <Welcome />}
          </div>
        )}
      </div>
      <div className="pb-5" />

      <CommentReplyModal />
    </div>
  );
});
