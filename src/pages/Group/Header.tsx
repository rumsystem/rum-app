import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { GoSync } from 'react-icons/go';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import { MdSearch } from 'react-icons/md';
import Loading from 'components/Loading';
import GroupMenu from './GroupMenu';
import { useStore } from 'store';
import GroupInfoModal from './GroupInfoModal';
import useActiveGroup from 'store/selectors/useActiveGroup';
import useHasPermission from 'store/selectors/useHasPermission';
import Tooltip from '@material-ui/core/Tooltip';
import { sleep } from 'utils';
import GroupApi, { GroupStatus } from 'apis/group';
import getProfile from 'store/selectors/getProfile';
import { FilterType } from 'store/activeGroup';
import Fade from '@material-ui/core/Fade';
import SearchInput from 'components/SearchInput';

export default observer(() => {
  const { activeGroupStore, nodeStore, groupStore } = useStore();
  const activeGroup = useActiveGroup();
  const hasPermission = useHasPermission();
  const state = useLocalObservable(() => ({
    anchorEl: null,
    showMenu: false,
    loading: false,
    showShareModal: false,
    showGroupInfoModal: false,
    showNatStatus: false,
    avatar: '',
  }));

  React.useEffect(() => {
    (async () => {
      await sleep(5000);
      state.showNatStatus = true;
    })();
  }, []);

  React.useEffect(() => {
    (async () => {
      try {
        state.avatar = getProfile(
          nodeStore.info.node_publickey,
          activeGroupStore.person
        ).avatar;
      } catch (err) {
        console.log(err);
      }
    })();
  }, [nodeStore, activeGroupStore.person]);

  const handleMenuClose = () => {
    state.anchorEl = null;
  };

  const openGroupInfoModal = () => {
    handleMenuClose();
    state.showGroupInfoModal = true;
  };

  const goToUserPage = async (publisher: string) => {
    if (activeGroupStore.filterType === FilterType.ME) {
      return;
    }
    activeGroupStore.setFilterUserIdSet([publisher]);
    activeGroupStore.setFilterType(FilterType.ME);
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

  return (
    <div className="border-b border-gray-200 h-13 px-6 flex items-center justify-between relative">
      {activeGroupStore.searchActive && (
        <div className="absolute top-0 left-0 w-full flex justify-center h-13 items-center">
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
                placeholder="搜索"
                size="small"
                autoFocus
                disabledClearButton
                search={handleSearch}
              />
            </div>
          </Fade>
        </div>
      )}

      <div className="flex items-center">
        <div
          className="font-bold text-gray-4a opacity-90 text-15 leading-none tracking-wider"
          onClick={() => openGroupInfoModal()}
        >
          {activeGroup.GroupName}{' '}
        </div>
        {!activeGroupStore.searchActive && (
          <div className="flex items-center">
            {activeGroup.GroupStatus === GroupStatus.GROUP_READY && (
              <Tooltip
                enterDelay={400}
                enterNextDelay={400}
                placement="bottom"
                title={`点击同步最新内容`}
                arrow
                interactive
              >
                <div
                  className="ml-3 opacity-40 cursor-pointer"
                  onClick={async () => {
                    try {
                      await GroupApi.syncGroup(activeGroupStore.id);
                      await sleep(100);
                      groupStore.updateGroup(activeGroupStore.id, {
                        ...activeGroup,
                        GroupStatus: GroupStatus.GROUP_SYNCING,
                      });
                    } catch (err) {
                      console.log(err);
                    }
                  }}
                >
                  <GoSync className="text-18 " />
                </div>
              </Tooltip>
            )}
            {activeGroup.GroupStatus === GroupStatus.GROUP_READY &&
              peersCount > 0 && (
                <Tooltip
                  placement="bottom"
                  title={`你的节点已连接上网络中的 ${peersCount} 个节点`}
                  arrow
                  interactive
                >
                  <div className="flex items-center py-1 px-3 rounded-full text-green-400 text-12 leading-none ml-3 font-bold tracking-wide opacity-85 mt-1-px">
                    <div
                      className="bg-green-300 rounded-full mr-2"
                      style={{ width: 8, height: 8 }}
                    ></div>{' '}
                    已连接 {peersCount} 个节点
                  </div>
                </Tooltip>
              )}
            {hasPermission &&
              activeGroup.GroupStatus === GroupStatus.GROUP_SYNCING && (
                <Fade in={true} timeout={500}>
                  <div className="flex items-center">
                    <div className="flex items-center py-1 px-3 rounded-full bg-gray-d8 text-gray-6d text-12 leading-none ml-3 font-bold tracking-wide">
                      <span className="mr-1">同步中</span> <Loading size={12} />
                    </div>
                  </div>
                </Fade>
              )}
            {!hasPermission &&
              activeGroup.GroupStatus === GroupStatus.GROUP_SYNCING && (
                <div className="flex items-center py-1 px-3 rounded-full text-red-400 text-12 leading-none ml-3 font-bold tracking-wide opacity-85 pt-6-px">
                  <div
                    className="bg-red-300 rounded-full mr-2"
                    style={{ width: 8, height: 8 }}
                  ></div>{' '}
                  你被禁止发言了，需要群主解禁才能发言和查看新内容
                </div>
              )}
          </div>
        )}
      </div>
      {!activeGroupStore.searchActive && (
        <div className="flex items-center">
          {!activeGroupStore.switchLoading && state.avatar && (
            <Fade in={true} timeout={500}>
              <div className="mr-4 flex items-center">
                <div
                  className="mr-8 text-24 text-gray-4a opacity-80 flex items-center cursor-pointer"
                  onClick={() => {
                    activeGroupStore.setSearchActive(true);
                  }}
                >
                  <MdSearch />
                </div>
                <Tooltip
                  placement="bottom"
                  title="我的主页"
                  arrow
                  interactive
                  enterDelay={400}
                  enterNextDelay={400}
                >
                  <img
                    onClick={() => goToUserPage(nodeStore.info.node_publickey)}
                    className="rounded-full border-shadow overflow-hidden cursor-pointer"
                    src={state.avatar}
                    alt={nodeStore.info.node_publickey}
                    width="38"
                    height="38"
                  />
                </Tooltip>
              </div>
            </Fade>
          )}
          <div className="py-2 text-24 text-gray-4a opacity-90">
            <GroupMenu />
          </div>
        </div>
      )}
      <GroupInfoModal
        open={state.showGroupInfoModal}
        onClose={() => {
          state.showGroupInfoModal = false;
        }}
      />
      <style jsx>{`
        .border-shadow {
          border: 2px solid hsl(212, 12%, 90%);
        }
      `}</style>
    </div>
  );
});
