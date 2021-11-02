import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { FiChevronLeft } from 'react-icons/fi';
import { GoSync } from 'react-icons/go';
import Loading from 'components/Loading';
import GroupMenu from './GroupMenu';
import { useStore } from 'store';
import GroupInfoModal from './GroupInfoModal';
import useActiveGroup from 'store/selectors/useActiveGroup';
import useHasPermission from 'store/selectors/useHasPermission';
import Tooltip from '@material-ui/core/Tooltip';
import { sleep } from 'utils';
import GroupApi from 'apis/group';
import getProfile from 'store/selectors/getProfile';
import { FilterType } from 'store/activeGroup';
import Fade from '@material-ui/core/Fade';

export default observer(() => {
  const { activeGroupStore, nodeStore, groupStore } = useStore();
  const activeGroup = useActiveGroup();
  const hasPermission = useHasPermission();
  const state = useLocalObservable(() => ({
    anchorEl: null,
    showMenu: false,
    showBackButton: false,
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

  if (state.showBackButton) {
    return (
      <div className="border-b border-gray-200 h-13 px-5 flex items-center">
        <div
          className="font-bold text-gray-33 text-14 leading-none tracking-wide flex items-center cursor-pointer"
          onClick={() => {
            state.showBackButton = false;
          }}
        >
          <FiChevronLeft className="text-20 mr-1 opacity-90" />
          返回
        </div>
      </div>
    );
  }

  const peersCount = (
    (nodeStore.groupNetworkMap[activeGroupStore.id] || {}).Peers || []
  ).length;

  return (
    <div className="border-b border-gray-200 h-13 px-6 flex items-center justify-between">
      <div className="flex items-center">
        <div
          className="font-bold text-gray-4a opacity-90 text-15 leading-none tracking-wider"
          onClick={() => openGroupInfoModal()}
        >
          {activeGroup.GroupName}{' '}
        </div>
        {activeGroup.GroupStatus === 'GROUP_READY' && (
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
                    GroupStatus: 'GROUP_SYNCING',
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
        {activeGroup.GroupStatus === 'GROUP_READY' && peersCount > 0 && (
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
        {hasPermission && activeGroup.GroupStatus === 'GROUP_SYNCING' && (
          <div className="flex items-center">
            <div className="flex items-center py-1 px-3 rounded-full bg-gray-d8 text-gray-6d text-12 leading-none ml-3 font-bold tracking-wide">
              <span className="mr-1">同步中</span> <Loading size={12} />
            </div>
            {state.showNatStatus &&
              nodeStore.network.node.nat_type !== 'Public' && (
                <div className="flex items-center py-1 px-3 rounded-full text-red-400 text-12 leading-none ml-3 font-bold tracking-wide opacity-85 pt-6-px">
                  <div
                    className="bg-red-300 rounded-full mr-2"
                    style={{ width: 8, height: 8 }}
                  ></div>{' '}
                  节点状态：{nodeStore.network.node.nat_type}
                </div>
              )}
          </div>
        )}
        {!hasPermission && activeGroup.GroupStatus === 'GROUP_SYNCING' && (
          <div className="flex items-center py-1 px-3 rounded-full text-red-400 text-12 leading-none ml-3 font-bold tracking-wide opacity-85 pt-6-px">
            <div
              className="bg-red-300 rounded-full mr-2"
              style={{ width: 8, height: 8 }}
            ></div>{' '}
            你被禁止发言了，需要群主解禁才能发言和查看新内容
          </div>
        )}
      </div>
      <div className="flex items-center">
        {!activeGroupStore.switchLoading && state.avatar && (
          <Fade in={true} timeout={500}>
            <div className="mr-4">
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
