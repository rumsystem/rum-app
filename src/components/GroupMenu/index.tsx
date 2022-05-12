import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { FiMoreHorizontal, FiDelete } from 'react-icons/fi';
import { MdInfoOutline } from 'react-icons/md';
import { HiOutlineBan } from 'react-icons/hi';
import { Menu, MenuItem } from '@material-ui/core';
import GroupInfoModal from 'components/GroupInfoModal';
import UnFollowingsModal from './UnFollowingsModal';
import { useStore } from 'store';
import GroupApi from 'apis/group';
import sleep from 'utils/sleep';
import { runInAction } from 'mobx';
import useDatabase from 'hooks/useDatabase';
import getSortedGroups from 'store/selectors/getSortedGroups';
import { lang } from 'utils/lang';
import useIsCurrentGroupOwner from 'store/selectors/useIsCurrentGroupOwner';

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
  const isGroupOwner = useIsCurrentGroupOwner();
  const state = useLocalObservable(() => ({
    anchorEl: null,
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

  const openUnFollowingsModal = () => {
    handleMenuClose();
    state.showUnFollowingsModal = true;
  };

  const handleExitConfirm = async () => {
    if (confirmDialogStore.loading) {
      return;
    }
    confirmDialogStore.setLoading(true);
    try {
      const removedGroupId = activeGroupStore.id;
      await GroupApi.leaveGroup(removedGroupId);
      await GroupApi.clearGroup(removedGroupId);
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
        message: lang.exited,
      });
    } catch (err) {
      console.error(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
  };

  const leaveGroup = () => {
    const latestStatus = latestStatusStore.map[activeGroupStore.id] || latestStatusStore.DEFAULT_LATEST_STATUS;
    let confirmText = '';
    if (latestStatus.producerCount === 1) {
      confirmText = '你是本群组唯一的出块节点，你退出之后，群组将永久作废，也无法正常使用。';
      if (isGroupOwner) {
        confirmText += '<br /><br />如果退出之后，仍然想要群组能继续正常运行，你可以添加另外一个出块节点来承担出块的工作<br /><br />';
      }
    }
    confirmText += lang.confirmToExit;
    confirmDialogStore.show({
      content: `<div>${confirmText}</div>`,
      okText: lang.yes,
      isDangerous: true,
      maxWidth: 340,
      ok: async () => {
        await handleExitConfirm();
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
          autoFocus={false}
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
              <span className="font-bold">{lang.info}</span>
            </div>
          </MenuItem>
          {activeGroupStore.unFollowingSet.size > 0 && (
            <MenuItem onClick={() => openUnFollowingsModal()}>
              <div className="flex items-center text-gray-600 leading-none pl-1 py-2">
                <span className="flex items-center mr-3">
                  <HiOutlineBan className="text-16 opacity-50" />
                </span>
                <span className="font-bold">{lang.unFollowing}</span>
              </div>
            </MenuItem>
          )}
          <MenuItem onClick={() => leaveGroup()}>
            <div className="flex items-center text-red-400 leading-none pl-1 py-2">
              <span className="flex items-center mr-3">
                <FiDelete className="text-16 opacity-50" />
              </span>
              <span className="font-bold">{lang.exit}</span>
            </div>
          </MenuItem>
        </Menu>
      </div>
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
