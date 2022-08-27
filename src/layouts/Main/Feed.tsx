import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import Loading from 'components/Loading';
import { useStore } from 'store';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import sleep from 'utils/sleep';
import { runInAction } from 'mobx';
import useQueryObjects from 'hooks/useQueryObjects';
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
import PubQueue from './PubQueue';
import getLatestObject from 'store/selectors/getLatestObject';
import useHasFrontHistoricalObject from 'store/selectors/useHasFrontHistoricalObject';
import MoreHistoricalObjectEntry from './MoreHistoricalObjectEntry';

const OBJECTS_LIMIT = 10;
const HISTORICAL_OBJECTS_LABEL_ID = 'HISTORICAL_OBJECTS_LABEL_ID';

interface Props {
  rootRef: React.RefObject<HTMLElement>
}

export default observer((props: Props) => {
  const store = useStore();
  const { activeGroupStore, latestStatusStore, sidebarStore } = store;
  const activeGroup = useActiveGroup();
  const state = useLocalObservable(() => ({
    loadingMore: false,
    isFetchingUnreadObjects: false,
    paidRequired: true,
  }));
  const queryObjects = useQueryObjects();
  const { unreadCount, latestReadTimeStamp } = useActiveGroupLatestStatus();
  const hasFrontHistoricalObject = useHasFrontHistoricalObject();

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
        console.log(objects.length, OBJECTS_LIMIT);
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
    const _unreadObjects = await queryObjects({
      GroupId: groupId,
      limit: Math.max(Math.min(unreadCount, 30), OBJECTS_LIMIT),
      order: activeGroupStore.objectsFilter.order,
    });
    if (groupId !== activeGroupStore.id) {
      return;
    }
    const unreadObjects = _unreadObjects.filter((o) => !activeGroupStore.objectMap[o.TrxId] && o.TimeStamp > latestReadTimeStamp).sort((o1, o2) => o2.TimeStamp - o1.TimeStamp);
    if (unreadObjects.length === 0) {
      latestStatusStore.update(activeGroupStore.id, {
        unreadCount: 0,
      });
      state.isFetchingUnreadObjects = false;
      return;
    }
    const storeLatestObject = getLatestObject(store);
    if (storeLatestObject) {
      activeGroupStore.addLatestObjectTimeStamp(storeLatestObject.TimeStamp);
      if (unreadCount >= 30) {
        activeGroupStore.truncateObjects(storeLatestObject.TimeStamp);
        activeGroupStore.setHasMoreObjects(true);
      }
    }
    if (activeGroupStore.objectTotal > 100) {
      activeGroupStore.truncateObjects();
      activeGroupStore.setHasMoreObjects(true);
    }
    if (unreadCount > OBJECTS_LIMIT) {
      activeGroupStore.setHasMoreObjects(true);
    }
    for (const unreadObject of [...unreadObjects].reverse()) {
      activeGroupStore.addObject(unreadObject, {
        isFront: true,
      });
    }
    const timeStamps = [...unreadObjects.map((o) => o.TimeStamp), latestReadTimeStamp];
    latestStatusStore.update(activeGroupStore.id, {
      latestReadTimeStamp: Math.max(...timeStamps),
      unreadCount: 0,
    });
    state.isFetchingUnreadObjects = false;
    if (hasFrontHistoricalObject) {
      const labelEle = document.querySelector(`#${HISTORICAL_OBJECTS_LABEL_ID}`);
      if (labelEle) {
        labelEle.scrollIntoView({
          block: 'start',
          behavior: 'smooth',
        });
      }
    }
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
          newObjectButtonDisabled={hasFrontHistoricalObject}
          historicalObjectsLabelId={HISTORICAL_OBJECTS_LABEL_ID}
        />
        {handleEmptyFollow()}
        <div ref={sentryRef} />
        <div className={classNames({
          '2lg:block mr-[-491px]': !sidebarStore.collapsed,
          'lg:block mr-[-368px]': sidebarStore.collapsed,
        }, 'fixed bottom-6 right-[50%] hidden')}
        >
          <BackToTop rootRef={props.rootRef} />
          {unreadCount > 0 && hasFrontHistoricalObject && (<>
            <div className="mb-4" />
            <MoreHistoricalObjectEntry
              fetchUnreadObjects={fetchUnreadObjects}
              unreadCount={unreadCount}
            />
          </>)}
          <div className="mb-4" />
          <Help />
          <div className="mb-4" />
          <PubQueue />
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
          newObjectButtonDisabled={hasFrontHistoricalObject}
          historicalObjectsLabelId={HISTORICAL_OBJECTS_LABEL_ID}
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
          {unreadCount > 0 && hasFrontHistoricalObject && (<>
            <div className="mb-4" />
            <MoreHistoricalObjectEntry
              fetchUnreadObjects={fetchUnreadObjects}
              unreadCount={unreadCount}
            />
          </>)}
          <div className="mb-4" />
          <Help />
          <div className="mb-4" />
          <PubQueue />
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
