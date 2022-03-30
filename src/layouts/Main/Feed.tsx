import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import ObjectEditor from './ObjectEditor';
import Objects from './Objects';
import Profile from './Profile';
import Loading from 'components/Loading';
import { useStore } from 'store';
import Button from 'components/Button';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import sleep from 'utils/sleep';
import { runInAction } from 'mobx';
import { ObjectsFilterType } from 'store/activeGroup';
import useQueryObjects from 'hooks/useQueryObjects';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import useActiveGroupLatestStatus from 'store/selectors/useActiveGroupLatestStatus';
import useDatabase from 'hooks/useDatabase';
import useActiveGroup from 'store/selectors/useActiveGroup';

const OBJECTS_LIMIT = 20;

interface Props {
  rootRef: React.RefObject<HTMLElement>
}

export default observer((props: Props) => {
  const { activeGroupStore, latestStatusStore } = useStore();
  const activeGroup = useActiveGroup();
  const state = useLocalObservable(() => ({
    loadingMore: false,
    isFetchingUnreadObjects: false,
  }));
  const queryObjects = useQueryObjects();
  const { objectsFilter } = activeGroupStore;
  const { unreadCount } = useActiveGroupLatestStatus();
  const database = useDatabase();

  const [sentryRef, { rootRef }] = useInfiniteScroll({
    loading: state.loadingMore,
    hasNextPage:
      activeGroupStore.objectTotal > 0 && activeGroupStore.hasMoreObjects,
    rootMargin: '0px 0px 200px 0px',
    onLoadMore: async () => {
      if (state.loadingMore) {
        return;
      }
      state.loadingMore = true;
      const groupId = activeGroupStore.id;
      const objects = await queryObjects({
        GroupId: groupId,
        limit: OBJECTS_LIMIT,
        TimeStamp: activeGroupStore.rearObject.TimeStamp,
      });
      if (groupId !== activeGroupStore.id) {
        return;
      }
      runInAction(() => {
        if (objects.length < OBJECTS_LIMIT) {
          activeGroupStore.setHasMoreObjects(false);
        }
        for (const object of objects) {
          activeGroupStore.addObject(object);
        }
      });
      await sleep(500);
      state.loadingMore = false;
    },
  });

  const fetchUnreadObjects = async () => {
    state.isFetchingUnreadObjects = true;
    const groupId = activeGroupStore.id;
    const unreadObjects = await queryObjects({
      GroupId: groupId,
      limit: OBJECTS_LIMIT,
    });
    if (groupId !== activeGroupStore.id) {
      return;
    }
    if (unreadObjects.length === 0) {
      latestStatusStore.updateMap(database, activeGroupStore.id, {
        unreadCount: 0,
      });
      state.isFetchingUnreadObjects = false;
      console.error('no unread objects');
      return;
    }
    const storeLatestObject = activeGroupStore.objects[0];
    if (
      storeLatestObject
      && storeLatestObject.Status === ContentStatus.synced
    ) {
      activeGroupStore.addLatestObjectTimeStamp(storeLatestObject.TimeStamp);
    }
    if (unreadCount > OBJECTS_LIMIT) {
      activeGroupStore.clearObjects();
    }
    for (const unreadObject of unreadObjects.reverse()) {
      activeGroupStore.addObject(unreadObject, {
        isFront: true,
      });
    }
    if (unreadCount > OBJECTS_LIMIT) {
      activeGroupStore.setHasMoreObjects(true);
    }
    const latestObject = unreadObjects[0];
    latestStatusStore.updateMap(database, activeGroupStore.id, {
      latestReadTimeStamp: latestObject.TimeStamp,
      unreadCount: 0,
    });
    state.isFetchingUnreadObjects = false;
  };

  React.useEffect(() => {
    rootRef(props.rootRef.current);
  }, [props.rootRef.current]);

  return (
    <div>
      {!activeGroupStore.mainLoading && !activeGroupStore.searchText && (
        <div className="w-full box-border px-5 lg:px-0 lg:w-[600px]">
          <Fade in={true} timeout={350}>
            <div>
              {objectsFilter.type === ObjectsFilterType.ALL && <ObjectEditor />}
              {objectsFilter.type === ObjectsFilterType.SOMEONE && (
                <Profile publisher={objectsFilter.publisher || ''} />
              )}
            </div>
          </Fade>

          {objectsFilter.type === ObjectsFilterType.ALL && unreadCount > 0 && (
            <div className="relative w-full">
              <div className="flex justify-center absolute left-0 w-full -top-2 z-10">
                <Fade in={true} timeout={350}>
                  <div>
                    <Button className="shadow-xl" onClick={fetchUnreadObjects}>
                      收到新的内容
                      {state.isFetchingUnreadObjects ? ' ...' : ''}
                    </Button>
                  </div>
                </Fade>
              </div>
            </div>
          )}

          {activeGroupStore.objectTotal === 0
            && objectsFilter.type === ObjectsFilterType.SOMEONE && (
            <Fade in={true} timeout={350}>
              <div className="pt-16 text-center text-14 text-gray-400 opacity-80">
                {objectsFilter.type === ObjectsFilterType.SOMEONE
                    && objectsFilter.publisher === activeGroup.user_pubkey
                    && '发布你的第一条内容吧 ~'}
              </div>
            </Fade>
          )}
        </div>
      )}

      {!activeGroupStore.mainLoading && (
        <div className="w-full box-border px-5 lg:px-0 lg:w-[600px]">
          <Objects />
          {state.loadingMore && (
            <div className="pt-3 pb-6 text-center text-12 text-gray-400 opacity-80">
              加载中 ...
            </div>
          )}
          {!state.loadingMore
            && !activeGroupStore.hasMoreObjects
            && activeGroupStore.objectTotal > 5 && (
            <div className="pt-2 pb-6 text-center text-12 text-gray-400 opacity-80">
              没有更多内容了哦
            </div>
          )}
        </div>
      )}

      {!activeGroupStore.mainLoading
        && activeGroupStore.objectTotal === 0
        && activeGroupStore.searchText && (
        <Fade in={true} timeout={350}>
          <div className="pt-32 text-center text-14 text-gray-400 opacity-80">
            没有搜索到相关的内容 ~
          </div>
        </Fade>
      )}

      {activeGroupStore.mainLoading && (
        <Fade in={true} timeout={600}>
          <div className="pt-32">
            <Loading />
          </div>
        </Fade>
      )}
      <div ref={sentryRef} />
    </div>
  );
});
