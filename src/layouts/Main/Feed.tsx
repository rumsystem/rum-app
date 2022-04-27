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
import SidebarMenu from 'layouts/Content/Sidebar/SidebarMenu';
import useActiveGroup from 'store/selectors/useActiveGroup';
import TimelineFeed from './Timeline/Feed';
import ForumFeed from './Forum/Feed';
import ForumAnnouncement from './Forum/Announcement';
import NoteFeed from './Note/Feed';
import { ObjectsFilterType } from 'store/activeGroup';
import { lang } from 'utils/lang';
import classNames from 'classnames';
import Help from 'layouts/Main/Help';
import BackToTop from 'components/BackToTop';
import { isTimelineGroup, isPostGroup, isNoteGroup } from 'store/selectors/group';
import PubQueueEntry from './PubQueueEntry';

const OBJECTS_LIMIT = 10;

interface Props {
  rootRef: React.RefObject<HTMLElement>
}

export default observer((props: Props) => {
  const { activeGroupStore, latestStatusStore, sidebarStore } = useStore();
  const activeGroup = useActiveGroup();
  const state = useLocalObservable(() => ({
    loadingMore: false,
    isFetchingUnreadObjects: false,
    paidRequired: true,
  }));
  const queryObjects = useQueryObjects();
  const { unreadCount } = useActiveGroupLatestStatus();

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
        order: activeGroupStore.objectsFilter.order,
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
      order: activeGroupStore.objectsFilter.order,
    });
    if (groupId !== activeGroupStore.id) {
      return;
    }
    if (unreadObjects.length === 0) {
      latestStatusStore.update(activeGroupStore.id, {
        unreadCount: 0,
      });
      state.isFetchingUnreadObjects = false;
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
    latestStatusStore.update(activeGroupStore.id, {
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

  const handleEmptyFollow = () =>
    activeGroupStore.objectsFilter.type === ObjectsFilterType.FOLLOW && activeGroupStore.objectTotal === 0 && (
      <div className="py-28 text-center text-14 text-gray-400 opacity-80">
        {lang.empty(lang.object)}
      </div>
    );

  if (isTimelineGroup(activeGroup)) {
    return (
      <div>
        <SidebarMenu className={classNames({
          '2lg:block 2lg:ml-[-276px]': !sidebarStore.collapsed,
          'lg:block lg:ml-[-418px]': sidebarStore.collapsed,
        }, 'fixed top-[136px] hidden left-[50%]')}
        />
        <TimelineFeed
          loadingMore={state.loadingMore}
          isFetchingUnreadObjects={state.isFetchingUnreadObjects}
          fetchUnreadObjects={fetchUnreadObjects}
        />
        {handleEmptyFollow()}
        <div ref={sentryRef} />
        <div className={classNames({
          '2lg:block mr-[-491px]': !sidebarStore.collapsed,
          'lg:block mr-[-368px]': sidebarStore.collapsed,
        }, 'fixed bottom-6 right-[50%] hidden')}
        >
          <BackToTop rootRef={props.rootRef} />
          <div className="mb-3" />
          <Help />
          <div className="mb-3" />
          <PubQueueEntry />
        </div>
      </div>
    );
  }

  if (isPostGroup(activeGroup)) {
    return (
      <div>
        <SidebarMenu className={classNames({
          '2lg:block 2lg:ml-[-325px]': !sidebarStore.collapsed,
          'lg:block lg:ml-[-474px]': sidebarStore.collapsed,
        }, 'fixed top-[134px] hidden left-[50%]')}
        />
        <ForumFeed
          loadingMore={state.loadingMore}
          isFetchingUnreadObjects={state.isFetchingUnreadObjects}
          fetchUnreadObjects={fetchUnreadObjects}
        />
        {handleEmptyFollow()}
        <div ref={sentryRef} />
        <div className={classNames({
          '2lg:block mr-[-582px]': !sidebarStore.collapsed,
          'lg:block mr-[-440px]': sidebarStore.collapsed,
        }, 'fixed top-[135px] right-[50%] hidden z-20')}
        >
          <ForumAnnouncement />
        </div>
        <div className={classNames({
          '2lg:block mr-[-547px]': !sidebarStore.collapsed,
          'lg:block mr-[-405px]': sidebarStore.collapsed,
        }, 'fixed bottom-6 right-[50%] hidden')}
        >
          <BackToTop rootRef={props.rootRef} />
          <div className="mb-3" />
          <Help />
          <div className="mb-3" />
          <PubQueueEntry />
        </div>
      </div>
    );
  }

  if (isNoteGroup(activeGroup)) {
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
