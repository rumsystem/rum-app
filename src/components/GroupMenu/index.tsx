import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { FiMoreHorizontal, FiDelete } from 'react-icons/fi';
import { MdInfoOutline, MdOutlineModeEditOutline } from 'react-icons/md';
import BxWallet from 'assets/bx-wallet.svg';
import { HiOutlineBan } from 'react-icons/hi';
import { Menu, MenuItem } from '@material-ui/core';
import { useStore } from 'store';
import useIsCurrentGroupOwner from 'store/selectors/useIsCurrentGroupOwner';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { groupInfo } from 'standaloneModals/groupInfo';
import { manageGroup } from 'standaloneModals/manageGroup';
import { lang } from 'utils/lang';
import { useLeaveGroup, useCheckWallet } from 'hooks/useLeaveGroup';
import IconSeednetManage from 'assets/icon_seednet_manage.svg';
import MutedListModal from './MutedListModal';
import useActiveGroupMutedPublishers from 'store/selectors/useActiveGroupMutedPublishers';
import GroupApi from 'apis/group';
import AuthListModal from './AuthListModal';
import AuthApi, { AuthType } from 'apis/auth';
import { isNoteGroup } from 'store/selectors/group';
import openWalletModal from 'standaloneModals/wallet/openWalletModal';

export default observer(() => {
  const {
    confirmDialogStore,
    activeGroupStore,
    latestStatusStore,
  } = useStore();

  const isGroupOwner = useIsCurrentGroupOwner();
  const activeGroup = useActiveGroup();
  const checkWallet = useCheckWallet();
  const leaveGroup = useLeaveGroup();
  const activeGroupMutedPublishers = useActiveGroupMutedPublishers();
  const latestStatus = latestStatusStore.map[activeGroupStore.id] || latestStatusStore.DEFAULT_LATEST_STATUS;
  const state = useLocalObservable(() => ({
    anchorEl: null,
    showMutedListModal: false,
    showAuthListModal: false,
    authType: 'FOLLOW_DNY_LIST' as AuthType,
  }));

  const handleMenuClick = async (event: any) => {
    state.anchorEl = event.currentTarget;
    const followingRule = await AuthApi.getFollowingRule(activeGroupStore.id, 'POST');
    state.authType = followingRule.AuthType;
  };

  const handleMenuClose = () => {
    state.anchorEl = null;
  };

  const openGroupInfoModal = () => {
    handleMenuClose();
    groupInfo(activeGroup);
  };

  const openMyWallet = () => {
    handleMenuClose();
    openWalletModal();
  };

  const openMutedListModal = () => {
    handleMenuClose();
    state.showMutedListModal = true;
  };

  const openAuthListModal = () => {
    handleMenuClose();
    state.showAuthListModal = true;
  };

  const handleLeaveGroup = async () => {
    let confirmText = '';
    const valid = await checkWallet(activeGroup);
    if (!valid) {
      confirmText += `<span class="text-red-400 font-bold">${lang.walletNoEmpty}</span><br/>`;
    }
    if (latestStatus.producerCount === 1 && isGroupOwner) {
      confirmText = lang.singleProducerConfirm;
    }
    confirmText += lang.confirmToExit;
    confirmDialogStore.show({
      content: `<div>${confirmText}</div>`,
      okText: lang.yes,
      isDangerous: true,
      maxWidth: 340,
      confirmTestId: 'exit-group-dialog-confirm-button',
      checkText: lang.cleanUpHistoryData,
      ok: async (checked) => {
        if (confirmDialogStore.loading) {
          return;
        }
        confirmDialogStore.setLoading(true);
        if (checked) {
          await GroupApi.clearGroup(activeGroup.group_id);
        }
        await leaveGroup(activeGroup.group_id);
        confirmDialogStore.hide();
      },
    });
    handleMenuClose();
  };

  const handleManageGroup = () => {
    manageGroup(activeGroupStore.id);
    handleMenuClose();
  };

  return (
    <div>
      <div>
        <div onClick={handleMenuClick} data-test-id="group-menu-button">
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
          <MenuItem onClick={() => openMyWallet()}>
            <div className="flex items-center text-gray-600 leading-none pl-1 py-2">
              <span className="flex items-center mr-3">
                <img width={18} className="opacity-50" src={BxWallet} />
              </span>
              <span className="font-bold">{lang.myWallet}</span>
            </div>
          </MenuItem>
          {activeGroupMutedPublishers.length > 0 && (
            <MenuItem onClick={() => openMutedListModal()}>
              <div className="flex items-center text-gray-600 leading-none pl-1 py-2">
                <span className="flex items-center mr-3">
                  <HiOutlineBan className="text-16 opacity-50" />
                </span>
                <span className="font-bold">{lang.mutedList}</span>
              </div>
            </MenuItem>
          )}
          {isGroupOwner && (
            <MenuItem onClick={handleManageGroup}>
              <div className="flex items-center text-gray-600 leading-none pl-1 py-2">
                <span className="flex items-center mr-3">
                  <img className="text-16 opacity-50" src={IconSeednetManage} />
                </span>
                <span className="font-bold">{lang.manageGroup}</span>
              </div>
            </MenuItem>
          )}
          {isGroupOwner && !isNoteGroup(activeGroup) && (
            <MenuItem onClick={() => openAuthListModal()}>
              <div className="flex items-center text-gray-600 leading-none pl-1 py-2">
                <span className="flex items-center mr-3">
                  <MdOutlineModeEditOutline className="text-18 opacity-50" />
                </span>
                <span className="font-bold">{state.authType === 'FOLLOW_DNY_LIST' ? lang.manageDefaultWriteMember : lang.manageDefaultReadMember}</span>
              </div>
            </MenuItem>
          )}
          <MenuItem
            onClick={() => handleLeaveGroup()}
            data-test-id="group-menu-exit-group-button"
          >
            <div className="flex items-center text-red-400 leading-none pl-1 py-2">
              <span className="flex items-center mr-3">
                <FiDelete className="text-16 opacity-50" />
              </span>
              <span className="font-bold">{lang.exitGroup}</span>
            </div>
          </MenuItem>
        </Menu>
      </div>
      <MutedListModal
        open={state.showMutedListModal}
        onClose={() => {
          state.showMutedListModal = false;
        }}
      />
      <AuthListModal
        authType={state.authType}
        open={state.showAuthListModal}
        onClose={() => {
          state.showAuthListModal = false;
        }}
      />
    </div>
  );
});
