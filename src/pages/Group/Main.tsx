import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import BackToTop from 'components/BackToTop';
import Editor from './Editor';
import Contents from './Contents';
import SidebarMenu from './SidebarMenu';
import Loading from 'components/Loading';
import UserHeader from './UserHeader';
import { useStore } from 'store';
import { FilterType } from 'store/activeGroup';
import Button from 'components/Button';
import GroupApi from 'apis/group';

export default observer(() => {
  const { activeGroupStore, groupStore } = useStore();
  const state = useLocalStore(() => ({
    isFetchingUnreadContents: false,
  }));

  const { filterType } = activeGroupStore;
  const unreadCount = groupStore.unReadCountMap[activeGroupStore.id] || 0;

  const fetchUnreadContents = async () => {
    state.isFetchingUnreadContents = true;
    const contents = await GroupApi.fetchContents(activeGroupStore.id);
    const storeLatestContent = activeGroupStore.contents[0];
    if (storeLatestContent) {
      activeGroupStore.addLatestContentTimeStamp(storeLatestContent.TimeStamp);
    }
    const unreadContents = (contents || [])
      .filter(
        (content) =>
          content.TimeStamp >
          groupStore.latestContentTimeStampMap[activeGroupStore.id]
      )
      .sort((a, b) => b.TimeStamp - a.TimeStamp);
    if (unreadContents.length > 0) {
      activeGroupStore.addContents(unreadContents);
      const latestContent = unreadContents[0];
      groupStore.setLatestContentTimeStamp(
        activeGroupStore.id,
        latestContent.TimeStamp
      );
      groupStore.updateUnReadCountMap(activeGroupStore.id, 0);
    }
    state.isFetchingUnreadContents = false;
  };

  return (
    <div className="flex flex-col items-center overflow-y-auto scroll-view">
      {filterType === FilterType.FOLLOW && <div className="-mt-3" />}
      <div className="pt-6" />

      <SidebarMenu />

      {!activeGroupStore.loading && (
        <div className="w-[600px]">
          <Fade in={true} timeout={500}>
            <div>
              {[FilterType.ALL, FilterType.ME].includes(filterType) && (
                <Editor />
              )}
              {filterType === FilterType.SOMEONE && (
                <UserHeader userId={activeGroupStore.filterUserIds[0]} />
              )}
            </div>
          </Fade>

          {filterType === FilterType.ALL && unreadCount > 0 && (
            <div className="relative w-full">
              <div className="flex justify-center absolute left-0 w-full -top-2 z-10">
                <Fade in={true} timeout={500}>
                  <div>
                    <Button className="shadow-xl" onClick={fetchUnreadContents}>
                      收到新的内容
                      {state.isFetchingUnreadContents ? ' ...' : ''}
                    </Button>
                  </div>
                </Fade>
              </div>
            </div>
          )}

          <Contents />

          {activeGroupStore.contentTotal === 0 &&
            [FilterType.ME, FilterType.FOLLOW].includes(filterType) && (
              <Fade in={true} timeout={500}>
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

      {activeGroupStore.loading && (
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
