import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { FiMoreHorizontal, FiDelete } from 'react-icons/fi';
import { MdInfoOutline } from 'react-icons/md';
import { HiOutlineShare, HiOutlineBan } from 'react-icons/hi';
import { Menu, MenuItem } from '@material-ui/core';
import ShareModal from 'components/ShareModal';
import GroupInfoModal from 'components/GroupInfoModal';
import UnFollowingsModal from './UnFollowingsModal';
import { useStore } from 'store';
import GroupApi from 'apis/group';
import sleep from 'utils/sleep';
import useIsGroupOwner from 'store/selectors/useIsGroupOwner';
import { runInAction } from 'mobx';
import useDatabase from 'hooks/useDatabase';
import getSortedGroups from 'store/selectors/getSortedGroups';

export default observer(() => {
  const {
    confirmDialogStore,
    groupStore,
    activeGroupStore,
    snackbarStore,
    seedStore,
    nodeStore,
    latestStatusStore,
  } = useStore();
  const database = useDatabase();
  const isCurrentGroupOwner = useIsGroupOwner(
    groupStore.map[activeGroupStore.id],
  );
  const state = useLocalObservable(() => ({
    anchorEl: null,
    showShareModal: false,
    showGroupInfoModal: false,
    showUnFollowingsModal: false,
  }));

  const handleMenuClick = (event: any) => {
    state.anchorEl = event.currentTarget;
  };

  const handleMenuClose = () => {
    state.anchorEl = null;
  };

  const openGroupInfoModal = () => {
    handleMenuClose();
    state.showGroupInfoModal = true;
  };

  const openGroupShareModal = () => {
    handleMenuClose();
    state.showShareModal = true;
  };

  const openUnFollowingsModal = () => {
    handleMenuClose();
    state.showUnFollowingsModal = true;
  };

  const handleExitConfirm = async (
    options: {
      isOwner?: boolean
    } = {},
  ) => {
    if (confirmDialogStore.loading) {
      return;
    }
    confirmDialogStore.setLoading(true);
    try {
      const removedGroupId = activeGroupStore.id;
      if (options.isOwner) {
        await GroupApi.deleteGroup(removedGroupId);
      } else {
        await GroupApi.leaveGroup(removedGroupId);
      }
      await sleep(500);
      const sortedGroups = getSortedGroups(groupStore.groups, latestStatusStore.map);
      const firstExistsGroup = sortedGroups.filter(
        (group) => group.group_id !== removedGroupId,
      )[0];
      runInAction(() => {
        activeGroupStore.setId(
          firstExistsGroup ? firstExistsGroup.group_id : '',
        );
        groupStore.deleteGroup(removedGroupId);
        seedStore.deleteSeed(nodeStore.storagePath, removedGroupId);
      });
      await latestStatusStore.remove(database, removedGroupId);
      confirmDialogStore.setLoading(false);
      confirmDialogStore.hide();
      await sleep(300);
      snackbarStore.show({
        message: '已退出',
      });
    } catch (err) {
      console.error(err);
      snackbarStore.show({
        message: '貌似出错了',
        type: 'error',
      });
    }
  };

  const leaveGroup = () => {
    confirmDialogStore.show({
      content: '确定要退出群组吗？',
      okText: '确定',
      isDangerous: true,
      ok: async () => {
        await handleExitConfirm();
      },
    });
    handleMenuClose();
  };

  const deleteGroup = () => {
    confirmDialogStore.show({
      content: '确定要删除群组吗？',
      okText: '确定',
      isDangerous: true,
      ok: async () => {
        await handleExitConfirm({
          isOwner: true,
        });
      },
    });
    handleMenuClose();
  };

  return (
    <div>
      <div>
        <div onClick={handleMenuClick}>
          <div className="px-2">
            <FiMoreHorizontal className="cursor-pointer" />
          </div>
        </div>
        <Menu
          anchorEl={state.anchorEl}
          open={Boolean(state.anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            style: {
              width: 110,
              margin: '27px 0 0 20px',
            },
          }}
        >
          <MenuItem onClick={() => openGroupInfoModal()}>
            <div className="flex items-center text-gray-600 leading-none pl-1 py-2">
              <span className="flex items-center mr-3">
                <MdInfoOutline className="text-18 opacity-50" />
              </span>
              <span className="font-bold">详情</span>
            </div>
          </MenuItem>
          <MenuItem onClick={() => openGroupShareModal()}>
            <div className="flex items-center text-gray-600 leading-none pl-1 py-2">
              <span className="flex items-center mr-3">
                <HiOutlineShare className="text-16 opacity-50" />
              </span>
              <span className="font-bold">分享</span>
            </div>
          </MenuItem>
          {activeGroupStore.unFollowingSet.size > 0 && (
            <MenuItem onClick={() => openUnFollowingsModal()}>
              <div className="flex items-center text-gray-600 leading-none pl-1 py-2">
                <span className="flex items-center mr-3">
                  <HiOutlineBan className="text-16 opacity-50" />
                </span>
                <span className="font-bold">屏蔽</span>
              </div>
            </MenuItem>
          )}
          {!isCurrentGroupOwner && (
            <MenuItem onClick={() => leaveGroup()}>
              <div className="flex items-center text-red-400 leading-none pl-1 py-2">
                <span className="flex items-center mr-3">
                  <FiDelete className="text-16 opacity-50" />
                </span>
                <span className="font-bold">退出</span>
              </div>
            </MenuItem>
          )}
          {isCurrentGroupOwner && (
            <MenuItem onClick={() => deleteGroup()}>
              <div className="flex items-center text-red-400 leading-none pl-1 py-2">
                <span className="flex items-center mr-3">
                  <FiDelete className="text-16 opacity-50" />
                </span>
                <span className="font-bold">删除</span>
              </div>
            </MenuItem>
          )}
        </Menu>
      </div>
      <ShareModal
        open={state.showShareModal}
        onClose={() => {
          state.showShareModal = false;
        }}
      />
      <GroupInfoModal
        open={state.showGroupInfoModal}
        onClose={() => {
          state.showGroupInfoModal = false;
        }}
      />
      <UnFollowingsModal
        open={state.showUnFollowingsModal}
        onClose={() => {
          state.showUnFollowingsModal = false;
        }}
      />
    </div>
  );
});
