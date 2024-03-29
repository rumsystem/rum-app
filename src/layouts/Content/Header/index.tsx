import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import { MdSearch } from 'react-icons/md';
import { HiOutlineShare, HiOutlineCube } from 'react-icons/hi';
import { GoSync } from 'react-icons/go';
import { Tooltip, Fade, Badge } from '@mui/material';
import Avatar from 'components/Avatar';
import GroupMenu from 'components/GroupMenu';
import Loading from 'components/Loading';
import SearchInput from 'components/SearchInput';
import sleep from 'utils/sleep';
import { GroupStatus } from 'apis/group';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { ObjectsFilterType } from 'store/activeGroup';
import { useStore } from 'store';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import Notification from './Notification';
import openProducerModal from 'standaloneModals/openProducerModal';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';
import { shareGroup } from 'standaloneModals/shareGroup';
import { lang } from 'utils/lang';
import { groupInfo } from 'standaloneModals/groupInfo';
import * as MainScrollView from 'utils/mainScrollView';
import GroupIcon from 'components/GroupIcon';
import ago from 'utils/ago';
import classNames from 'classnames';
import { isNoteGroup } from 'store/selectors/group';
import { getGroupIcon } from 'utils/getGroupIcon';
import { contentTaskManager } from 'hooks/usePolling/content';

export default observer(() => {
  const { activeGroupStore, nodeStore, groupStore } = useStore();
  const activeGroup = useActiveGroup();
  const state = useLocalObservable(() => ({
    anchorEl: null,
    showMenu: false,
    loading: false,
    showNatStatus: false,
    get profile() {
      return groupStore.profileMap[activeGroupStore.id];
    },
  }));

  const GroupTypeIcon = getGroupIcon(activeGroup.app_key);

  React.useEffect(() => {
    (async () => {
      await sleep(5000);
      state.showNatStatus = true;
    })();
  }, []);

  const handleMenuClose = () => {
    state.anchorEl = null;
  };

  const openGroupInfoModal = () => {
    handleMenuClose();
    groupInfo(activeGroup);
  };

  const handleSearch = (keyword: string) => {
    if (!keyword) {
      return;
    }
    activeGroupStore.setSearchText(keyword);
  };

  const peersCount = (
    (nodeStore.groupNetworkMap[activeGroupStore.id] || {}).Peers || []
  ).length;

  const nodeConnected = nodeStore.connected;
  const isGroupSyncing = nodeConnected && activeGroup.group_status === GroupStatus.SYNCING;
  const showSyncFailedTip = nodeConnected && activeGroup.group_status === GroupStatus.SYNC_FAILED;
  const showConnectionStatus = nodeConnected && peersCount > 0;

  const { objectsFilter } = activeGroupStore;
  const openingMyHomePage = objectsFilter.publisher === activeGroup.user_pubkey;
  const profile = groupStore.profileMap[activeGroup.group_id];
  const isProfileSyncing = !!profile && profile.status !== ContentStatus.synced && !openingMyHomePage;

  const isPostOrTimeline = [
    GROUP_TEMPLATE_TYPE.TIMELINE,
    GROUP_TEMPLATE_TYPE.POST,
  ].includes(activeGroup.app_key as GROUP_TEMPLATE_TYPE);

  return (
    <div
      className="border-b border-gray-200 h-[70px] flex-none pr-6 flex items-center justify-between relative"
      onDoubleClick={() => {
        MainScrollView.scrollToTop();
      }}
    >
      {activeGroupStore.searchActive && (
        <div className="absolute top-0 left-0 w-full flex justify-center h-[70px] items-center">
          <Fade in={true} timeout={500}>
            <div className="relative">
              <div
                className="absolute top-0 right-[-2px] pt-[3px] -mr-12 opacity-60 cursor-pointer px-1"
                onClick={() => {
                  activeGroupStore.setSearchActive(false);
                  activeGroupStore.setSearchText('');
                }}
              >
                <AiOutlineCloseCircle className="text-28" />
              </div>
              <SearchInput
                className="w-64"
                placeholder={lang.search}
                size="small"
                autoFocus
                disabledClearButton
                search={handleSearch}
              />
            </div>
          </Fade>
        </div>
      )}

      <div className="flex self-stretch items-center flex-1 w-0">
        <GroupIcon width={44} height={44} fontSize={24} groupId={activeGroupStore.id} className="rounded-6 mr-3 ml-6" />
        <div
          className="font-bold text-black text-18 tracking-wider truncate cursor-pointer"
        >
          <div className="flex items-center">
            <span
              className="opacity-90"
              onClick={() => openGroupInfoModal()}
              data-test-id="header-group-name"
            >
              {activeGroup.group_name}
            </span>
            <GroupTypeIcon
              className="ml-[6px] flex-none opacity-90 text-gray-9c"
              width="18"
            />
          </div>
          <div className="mt-[2px] text-11 transform flex items-center opacity-90">
            <span className="text-gray-9c">
              {lang.updatedAt(ago(activeGroup.last_updated))}
            </span>
            <Tooltip
              enterDelay={800}
              enterNextDelay={800}
              placement="bottom"
              title={isGroupSyncing ? lang.syncingContentTip : lang.clickToSync}
              arrow
            >
              <div
                className="ml-1 cursor-pointer transform scale-90 opacity-40"
                onClick={() => {
                  contentTaskManager.jumpIn(activeGroupStore.id);
                }}
              >
                <GoSync className={classNames({
                  'animate-spin': isGroupSyncing,
                }, 'text-18')}
                />
              </div>
            </Tooltip>
            <div className="flex items-center flex-none">
              {showSyncFailedTip && (
                <Fade in={true} timeout={500}>
                  <div
                    className="flex items-center py-1 px-3 rounded-full text-12 leading-none ml-3 font-bold tracking-wide opacity-85 mt-1-px select-none"
                    style={{ color: '#f87171' }}
                  >
                    <div
                      className="rounded-full mr-2"
                      style={{ width: 8, height: 8, backgroundColor: '#f87171' }}
                    />{' '}
                    {lang.syncFailed}
                  </div>
                </Fade>
              )}
              {showConnectionStatus && (
                <Tooltip
                  enterDelay={500}
                  enterNextDelay={500}
                  placement="bottom"
                  title={lang.connectedPeerCountTip(peersCount)}
                  arrow
                >
                  <div className="flex items-center py-1 px-3 rounded-full text-emerald-400 text-12 leading-none ml-3 font-bold tracking-wide opacity-85 mt-1-px select-none">
                    <div
                      className="bg-emerald-300 rounded-full mr-2"
                      style={{ width: 8, height: 8 }}
                    />{' '}
                    {lang.connectedPeerCount(peersCount)}
                  </div>
                </Tooltip>
              )}
              {!nodeConnected && (
                <Fade in={true} timeout={500}>
                  <div className="flex items-center">
                    <div className="flex items-center py-1 px-3 rounded-full bg-red-400 text-opacity-90 text-white text-12 leading-none ml-3 font-bold tracking-wide">
                      <span className="mr-1">{lang.reconnecting}</span> <Loading size={12} color="#fff" />
                    </div>
                  </div>
                </Fade>
              )}
            </div>
          </div>
        </div>
      </div>
      {!activeGroupStore.searchActive && (
        <div className="flex items-center">
          {!activeGroupStore.switchLoading && state.profile && !activeGroupStore.paidRequired && (
            <Fade in={true} timeout={500}>
              <div className="mr-4 flex items-center gap-x-7">
                {isPostOrTimeline && (
                  <Notification className="text-26 text-gray-4a flex flex-center" />
                )}
                <MdSearch
                  className="text-24 text-gray-4a flex items-center cursor-pointer"
                  onClick={() => {
                    activeGroupStore.setSearchActive(true);
                  }}
                />
                {false && (
                  <Badge
                    className="transform"
                    classes={{
                      badge: 'bg-red-500',
                    }}
                    invisible={!groupStore.hasAnnouncedProducersMap[activeGroupStore.id]}
                    variant="dot"
                  >
                    <div
                      className="flex flex-center cursor-pointer text-16 text-gray-4a"
                      onClick={() => openProducerModal()}
                    >
                      <HiOutlineCube className="text-22 mr-[6px] opacity-90" />
                      {lang.createBlock}
                    </div>
                  </Badge>
                )}
                {!isNoteGroup(activeGroup) && (
                  <div
                    className="flex flex-center text-link-blue cursor-pointer text-16 opacity-80"
                    onClick={() => shareGroup(activeGroup.group_id)}
                    data-test-id="header-share-group"
                  >
                    <HiOutlineShare className="text-16 mr-[6px]" />
                    {lang.share}
                  </div>
                )}
                {isPostOrTimeline && (
                  <div className="flex items-center">
                    <Avatar
                      className="cursor-pointer"
                      avatar={state.profile.avatar}
                      size={38}
                      loading={isProfileSyncing}
                      data-test-id="header-avatar"
                      onClick={() => {
                        activeGroupStore.setPostsFilter({
                          type: ObjectsFilterType.SOMEONE,
                          publisher: activeGroup.user_pubkey,
                        });
                      }}
                    />
                    <div
                      className="cursor-pointer ml-2 text-14 text-gray-6f max-w-[160px] truncate"
                      onClick={() => {
                        activeGroupStore.setPostsFilter({
                          type: ObjectsFilterType.SOMEONE,
                          publisher: activeGroup.user_pubkey,
                        });
                      }}
                    >{state.profile.name}</div>
                  </div>
                )}
              </div>
            </Fade>
          )}
          <div className="py-2 text-24 text-gray-70">
            <GroupMenu />
          </div>
        </div>
      )}
    </div>
  );
});
