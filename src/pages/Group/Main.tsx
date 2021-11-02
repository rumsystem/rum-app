import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import BackToTop from 'components/BackToTop';
import Editor from './Editor';
import Objects from './Objects';
import SidebarMenu from './SidebarMenu';
import Profile from './Profile';
import Loading from 'components/Loading';
import { useStore } from 'store';
import { FilterType } from 'store/activeGroup';
import Button from 'components/Button';
import useQueryObjects from 'hooks/useQueryObjects';
import { DEFAULT_LATEST_STATUS } from 'store/group';

const OBJECTS_LIMIT = 20;

export default observer(() => {
  const { activeGroupStore, groupStore } = useStore();
  const state = useLocalObservable(() => ({
    isFetchingUnreadObjects: false,
  }));
  const queryObjects = useQueryObjects();

  const { filterType } = activeGroupStore;
  const unreadCount = (
    groupStore.latestStatusMap[activeGroupStore.id] || DEFAULT_LATEST_STATUS
  ).unreadCount;

  const fetchUnreadObjects = async () => {
    state.isFetchingUnreadObjects = true;
    const unreadObjects = await queryObjects({
      GroupId: activeGroupStore.id,
      limit: OBJECTS_LIMIT,
    });
    if (unreadObjects.length === 0) {
      groupStore.updateLatestStatusMap(activeGroupStore.id, {
        unreadCount: 0,
      });
      state.isFetchingUnreadObjects = false;
      console.error('no unread objects');
      return;
    }
    const storeLatestContent = activeGroupStore.objects[0];
    if (storeLatestContent) {
      activeGroupStore.addLatestContentTimeStamp(storeLatestContent.TimeStamp);
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
    groupStore.updateLatestStatusMap(activeGroupStore.id, {
      latestReadTimeStamp: latestObject.TimeStamp,
      unreadCount: 0,
    });
    state.isFetchingUnreadObjects = false;
  };

  return (
    <div className="flex flex-col items-center overflow-y-auto scroll-view">
      {filterType === FilterType.FOLLOW && <div className="-mt-3" />}
      <div className="pt-6" />
      <SidebarMenu />
      {!activeGroupStore.mainLoading && (
        <div className="w-full px-5 box-border lg:px-0 lg:w-[600px]">
          <Fade in={true} timeout={350}>
            <div>
              {filterType === FilterType.ALL && <Editor />}
              {[FilterType.SOMEONE, FilterType.ME].includes(filterType) && (
                <Profile
                  userId={Array.from(activeGroupStore.filterUserIdSet)[0]}
                />
              )}
            </div>
          </Fade>

          {filterType === FilterType.ALL && unreadCount > 0 && (
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

          {activeGroupStore.objectTotal === 0 &&
            [FilterType.ME, FilterType.FOLLOW].includes(filterType) && (
              <Fade in={true} timeout={350}>
                <div className="pt-16 text-center text-14 text-gray-400 opacity-80">
                  {filterType === FilterType.ME && '发布你的第一条内容吧 ~'}
                  {filterType === FilterType.FOLLOW && (
                    <div className="pt-16">去关注你感兴趣的人吧 ~</div>
                  )}
                </div>
              </Fade>
            )}
        </div>
      )}
      {!activeGroupStore.mainLoading && <Objects />}
      {activeGroupStore.mainLoading && (
        <div className="pt-32">
          <Loading />
        </div>
      )}
      <div className="pb-5" />
      <BackToTop elementSelector=".scroll-view" />
      <style jsx>{`
        .scroll-view {
          height: calc(100vh - 52px);
        }
      `}</style>
    </div>
  );
});
