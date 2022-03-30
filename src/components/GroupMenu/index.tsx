import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { FiMoreHorizontal, FiDelete } from 'react-icons/fi';
import { MdInfoOutline } from 'react-icons/md';
import { HiOutlineBan } from 'react-icons/hi';
import { Menu, MenuItem } from '@material-ui/core';
import { useStore } from 'store';
import useIsCurrentGroupOwner from 'store/selectors/useIsCurrentGroupOwner';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { groupInfo } from 'standaloneModals/groupInfo';
import { manageGroup } from 'standaloneModals/manageGroup';
import { lang } from 'utils/lang';
import { useLeaveGroup } from 'hooks/useLeaveGroup';
import IconSeednetManage from 'assets/icon_seednet_manage.svg';
import BlockListModal from './BlockListModal';

export default observer(() => {
  const {
    confirmDialogStore,
    activeGroupStore,
    latestStatusStore,
  } = useStore();

  const isGroupOwner = useIsCurrentGroupOwner();
  const activeGroup = useActiveGroup();
  const leaveGroup = useLeaveGroup();
  const latestStatus = latestStatusStore.map[activeGroupStore.id] || latestStatusStore.DEFAULT_LATEST_STATUS;
  const state = useLocalObservable(() => ({
    anchorEl: null,
    showBlockListModal: false,
  }));

  const handleMenuClick = (event: any) => {
    state.anchorEl = event.currentTarget;
  };

  const handleMenuClose = () => {
    state.anchorEl = null;
  };

  const openGroupInfoModal = () => {
    handleMenuClose();
    groupInfo(activeGroup);
  };

  const openBlockListModal = () => {
    handleMenuClose();
    state.showBlockListModal = true;
  };

  const handleLeaveGroup = () => {
    let confirmText = '';
    if (latestStatus.producerCount === 1 && isGroupOwner) {
      confirmText = lang.singleProducerConfirm;
    }
    confirmText += lang.confirmToExit;
    confirmDialogStore.show({
      content: `<div>${confirmText}</div>`,
      okText: lang.yes,
      isDangerous: true,
      maxWidth: 340,
      ok: () => {
        if (confirmDialogStore.loading) {
          return;
        }
        confirmDialogStore.setLoading(true);
        leaveGroup(activeGroup.group_id).then(() => {
          confirmDialogStore.hide();
        }).finally(() => {
          confirmDialogStore.setLoading(false);
        });
      },
    });
    handleMenuClose();
  };

  const handleManageGroup = () => {
    manageGroup(activeGroupStore.id);
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
              width: 150,
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
          {activeGroupStore.blockListSet.size > 0 && (
            <MenuItem onClick={() => openBlockListModal()}>
              <div className="flex items-center text-gray-600 leading-none pl-1 py-2">
                <span className="flex items-center mr-3">
                  <HiOutlineBan className="text-16 opacity-50" />
                </span>
                <span className="font-bold">{lang.blockList}</span>
              </div>
            </MenuItem>
          )}
          <MenuItem onClick={handleManageGroup}>
            <div className="flex items-center text-gray-600 leading-none pl-1 py-2">
              <span className="flex items-center mr-3">
                <img className="text-16 opacity-50" src={IconSeednetManage} />
              </span>
              <span className="font-bold">{lang.manageGroup}</span>
            </div>
          </MenuItem>
          <MenuItem onClick={() => handleLeaveGroup()}>
            <div className="flex items-center text-red-400 leading-none pl-1 py-2">
              <span className="flex items-center mr-3">
                <FiDelete className="text-16 opacity-50" />
              </span>
              <span className="font-bold">{lang.exitGroup}</span>
            </div>
          </MenuItem>
        </Menu>
      </div>
      <BlockListModal
        open={state.showBlockListModal}
        onClose={() => {
          state.showBlockListModal = false;
        }}
      />
    </div>
  );
});
