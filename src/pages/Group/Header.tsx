import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { FiChevronLeft } from 'react-icons/fi';
import Loading from 'components/Loading';
import GroupMenu from './GroupMenu';
import { useStore } from 'store';
import GroupInfoModal from './GroupInfoModal';
import useHasPermission from 'hooks/useHasPermission';
import Tooltip from '@material-ui/core/Tooltip';
import { sleep } from 'utils';

export default observer(() => {
  const { groupStore, nodeStore } = useStore();
  const hasPermission = useHasPermission();
  const state = useLocalStore(() => ({
    anchorEl: null,
    showMenu: false,
    showBackButton: false,
    loading: false,
    showShareModal: false,
    showGroupInfoModal: false,
    showNatStatus: false,
  }));

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
    state.showGroupInfoModal = true;
  };

  if (state.showBackButton) {
    return (
      <div className="border-b border-gray-200 h-13 px-5 flex items-center">
        <div
          className="font-bold text-indigo-400 text-14 leading-none tracking-wide flex items-center cursor-pointer"
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
    (nodeStore.groupNetworkMap[groupStore.id] || {}).Peers || []
  ).length;

  return (
    <div className="border-b border-gray-200 h-13 px-6 flex items-center justify-between">
      <div className="flex items-center">
        <div
          className="font-bold text-gray-4a opacity-90 text-15 leading-none tracking-wider"
          onClick={() => openGroupInfoModal()}
        >
          {groupStore.group.GroupName}{' '}
        </div>
        {groupStore.group.GroupStatus === 'GROUP_READY' && peersCount > 0 && (
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
        {hasPermission && groupStore.group.GroupStatus === 'GROUP_SYNCING' && (
          <div className="flex items-center">
            <div className="flex items-center py-1 px-3 rounded-full bg-indigo-100 text-indigo-400 text-12 leading-none ml-3 font-bold tracking-wide">
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
        {!hasPermission && groupStore.group.GroupStatus === 'GROUP_SYNCING' && (
          <div className="flex items-center py-1 px-3 rounded-full text-red-400 text-12 leading-none ml-3 font-bold tracking-wide opacity-85 pt-6-px">
            <div
              className="bg-red-300 rounded-full mr-2"
              style={{ width: 8, height: 8 }}
            ></div>{' '}
            你被禁止发言了，需要群主解禁才能发言和查看新内容
          </div>
        )}
      </div>
      <div className="p-2 text-24">
        <GroupMenu />
      </div>
      <GroupInfoModal
        open={state.showGroupInfoModal}
        onClose={() => {
          state.showGroupInfoModal = false;
        }}
      />
    </div>
  );
});
