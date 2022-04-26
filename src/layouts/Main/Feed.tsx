import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import Loading from 'components/Loading';
import { useStore } from 'store';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import sleep from 'utils/sleep';
import { runInAction } from 'mobx';
import useQueryObjects from 'hooks/useQueryObjects';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import useActiveGroupLatestStatus from 'store/selectors/useActiveGroupLatestStatus';
import useDatabase from 'hooks/useDatabase';
import useActiveGroup from 'store/selectors/useActiveGroup';
import SocialNetworkFeed from './SocialNetwork/Feed';
import ForumFeed from './Forum/Feed';
import NoteFeed from './Note/Feed';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';

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

  if (activeGroupStore.mainLoading) {
    return (
      <Fade in={true} timeout={600}>
        <div className="pt-32">
          <Loading />
        </div>
      </Fade>
    );
  }

  if (activeGroup.app_key === GROUP_TEMPLATE_TYPE.TIMELINE) {
    return (
      <div>
        <SocialNetworkFeed
          loadingMore={state.loadingMore}
          isFetchingUnreadObjects={state.isFetchingUnreadObjects}
          fetchUnreadObjects={fetchUnreadObjects}
        />
        <div ref={sentryRef} />
      </div>
    );
  }

  if (activeGroup.app_key === GROUP_TEMPLATE_TYPE.POST) {
    return (
      <div>
        <ForumFeed
          loadingMore={state.loadingMore}
          isFetchingUnreadObjects={state.isFetchingUnreadObjects}
          fetchUnreadObjects={fetchUnreadObjects}
        />
        <div ref={sentryRef} />
      </div>
    );
  }

  if (activeGroup.app_key === GROUP_TEMPLATE_TYPE.NOTE) {
    return (
      <div>
        <NoteFeed
          loadingMore={state.loadingMore}
          isFetchingUnreadObjects={state.isFetchingUnreadObjects}
          fetchUnreadObjects={fetchUnreadObjects}
        />
        <div ref={sentryRef} />
      </div>
    );
  }

  return null;
});
