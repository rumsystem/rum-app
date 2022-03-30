import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { toJS } from 'mobx';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import { MdSearch } from 'react-icons/md';
import Loading from 'components/Loading';
import GroupMenu from 'components/GroupMenu';
import { useStore } from 'store';
import GroupInfoModal from 'components/GroupInfoModal';
import useActiveGroup from 'store/selectors/useActiveGroup';
import useHasPermission from 'store/selectors/useHasPermission';
import Tooltip from '@material-ui/core/Tooltip';
import sleep from 'utils/sleep';
import { GroupStatus } from 'apis/group';
import Fade from '@material-ui/core/Fade';
import SearchInput from 'components/SearchInput';
import { ObjectsFilterType } from 'store/activeGroup';
import Avatar from 'components/Avatar';
import Notification from './Notification';
import { GoSync } from 'react-icons/go';

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
    profile: {
      avatar: '',
      name: '',
    },
  }));

  React.useEffect(() => {
    (async () => {
      await sleep(5000);
      state.showNatStatus = true;
    })();
  }, []);

  React.useEffect(() => {
    try {
      state.profile = toJS(activeGroupStore.profile);
    } catch (err) {
      console.log(err);
    }
  }, [nodeStore, activeGroupStore.profile]);

  const handleMenuClose = () => {
    state.anchorEl = null;
  };

  const openGroupInfoModal = () => {
    handleMenuClose();
    state.showGroupInfoModal = true;
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

  const showBannedTip = !hasPermission && activeGroup.group_status === GroupStatus.GROUP_SYNCING;
  const showSyncTooltip = hasPermission
    && activeGroup.showSync
    && activeGroup.group_status === GroupStatus.GROUP_SYNCING;
  const showConnectionStatus = peersCount > 0
    && (
      activeGroup.group_status === GroupStatus.GROUP_READY
      || !activeGroup.showSync
    );

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
          {activeGroup.group_name}{' '}
        </div>
        {!activeGroupStore.searchActive && (
          <div className="flex items-center">
            {showConnectionStatus && (
              <Tooltip
                enterDelay={400}
                enterNextDelay={400}
                placement="bottom"
                title="点击同步最新内容"
                arrow
                interactive
              >
                <div
                  className="ml-3 opacity-40 cursor-pointer"
                  onClick={() => {
                    groupStore.syncGroup(activeGroupStore.id, true);
                  }}
                >
                  <GoSync className="text-18 " />
                </div>
              </Tooltip>
            )}
            {showConnectionStatus && (
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
                  />{' '}
                  已连接 {peersCount} 个节点
                </div>
              </Tooltip>
            )}
            {showSyncTooltip && (
              <Fade in={true} timeout={500}>
                <Tooltip
                  title="正在检查并同步群组的最新内容，请您耐心等待"
                  placement="bottom"
                >
                  <div className="flex items-center">
                    <div className="flex items-center py-1 px-3 rounded-full bg-gray-d8 text-gray-6d text-12 leading-none ml-3 font-bold tracking-wide">
                      <span className="mr-1">同步中</span> <Loading size={12} />
                    </div>
                  </div>
                </Tooltip>
              </Fade>
            )}
            {showBannedTip && (
              <div className="flex items-center py-1 px-3 rounded-full text-red-400 text-12 leading-none ml-3 font-bold tracking-wide opacity-85 pt-6-px">
                <div
                  className="bg-red-300 rounded-full mr-2"
                  style={{ width: 8, height: 8 }}
                />{' '}
                你被禁止发言了，需要群主解禁才能发言和查看新内容
              </div>
            )}
          </div>
        )}
      </div>
      {!activeGroupStore.searchActive && (
        <div className="flex items-center">
          {!activeGroupStore.switchLoading && state.profile && (
            <Fade in={true} timeout={500}>
              <div className="mr-4 flex items-center">
                <div className="mr-8 text-24 text-gray-4a flex items-center cursor-pointer">
                  <Notification />
                </div>
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
                  <div>
                    <Avatar
                      className="cursor-pointer"
                      profile={state.profile}
                      size={38}
                      onClick={() => {
                        activeGroupStore.setObjectsFilter({
                          type: ObjectsFilterType.SOMEONE,
                          publisher: activeGroup.user_pubkey,
                        });
                      }}
                    />
                  </div>
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
    </div>
  );
});
