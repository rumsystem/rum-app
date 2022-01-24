import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { FiMoreHorizontal } from 'react-icons/fi';
import { MdInfoOutline } from 'react-icons/md';
import { HiOutlineShare } from 'react-icons/hi';
import { FiDelete } from 'react-icons/fi';
import { Menu, MenuItem } from '@material-ui/core';
import ShareModal from './ShareModal';
import GroupInfoModal from './GroupInfoModal';
import { useStore } from 'store';
import GroupApi from 'apis/group';
import { sleep } from 'utils';
import useIsGroupOwner from 'store/selectors/useIsGroupOwner';
import { runInAction } from 'mobx';

export default observer(() => {
  const {
    confirmDialogStore,
    groupStore,
    activeGroupStore,
    snackbarStore,
    seedStore,
    nodeStore,
  } = useStore();
  const isCurrentGroupOwner = useIsGroupOwner(
    groupStore.map[activeGroupStore.id]
  );
  const state = useLocalObservable(() => ({
    anchorEl: null,
    showShareModal: false,
    showGroupInfoModal: false,
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

  const handleExitConfirm = async (
    options: {
      isOwner?: boolean;
    } = {}
  ) => {
    confirmDialogStore.setLoading(true);
    try {
      const removedGroupId = activeGroupStore.id;
      (await options.isOwner)
        ? GroupApi.deleteGroup(removedGroupId)
        : GroupApi.leaveGroup(removedGroupId);
      await sleep(500);
      runInAction(() => {
        const firstExistsGroup = groupStore.groups.filter(
          (group) => group.GroupId !== removedGroupId
        )[0];
        activeGroupStore.setId(
          firstExistsGroup ? firstExistsGroup.GroupId : ''
        );
        activeGroupStore.clearAfterGroupChanged();
        groupStore.deleteGroup(removedGroupId);
        seedStore.deleteSeed(nodeStore.storagePath, removedGroupId);
      });
      confirmDialogStore.setLoading(false);
      confirmDialogStore.hide();
      await sleep(300);
      snackbarStore.show({
        message: '已离开',
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
      content: `确定要离开群组吗？`,
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
      content: `确定要删除群组吗？`,
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
          {!isCurrentGroupOwner && (
            <MenuItem onClick={() => leaveGroup()}>
              <div className="flex items-center text-red-400 leading-none pl-1 py-2">
                <span className="flex items-center mr-3">
                  <FiDelete className="text-16 opacity-50" />
                </span>
                <span className="font-bold">离开</span>
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
    </div>
  );
});
