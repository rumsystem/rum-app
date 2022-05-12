import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { Menu, MenuItem } from '@material-ui/core';
import sleep from 'utils/sleep';
import { HiOutlineBan, HiOutlineCheckCircle } from 'react-icons/hi';
import { RiMoreFill } from 'react-icons/ri';
import { MdInfoOutline } from 'react-icons/md';
import DeniedListApi from 'apis/deniedList';
import { IObjectItem } from 'apis/content';
import { useStore } from 'store';
import useIsGroupOwner from 'store/selectors/useIsGroupOwner';
import useActiveGroup from 'store/selectors/useActiveGroup';
import TrxModal from 'components/TrxModal';
import useOffChainDatabase from 'hooks/useOffChainDatabase';
import { lang } from 'utils/lang';

export default observer((props: { object: IObjectItem }) => {
  const { object } = props;
  const {
    authStore,
    snackbarStore,
    confirmDialogStore,
    activeGroupStore,
  } = useStore();
  const activeGroup = useActiveGroup();
  const isGroupOwner = useIsGroupOwner(activeGroup);
  const offChainDatabase = useOffChainDatabase();
  const state = useLocalObservable(() => ({
    anchorEl: null,
    showTrxModal: false,
  }));

  const handleMenuClick = (event: any) => {
    state.anchorEl = event.currentTarget;
  };

  const handleMenuClose = () => {
    state.anchorEl = null;
  };

  const unFollow = (publisher: string) => {
    handleMenuClose();
    confirmDialogStore.show({
      content: lang.confirmToUnFollow,
      okText: lang.yes,
      ok: async () => {
        try {
          await activeGroupStore.unFollow(offChainDatabase, {
            groupId: activeGroupStore.id,
            publisher,
          });
          confirmDialogStore.hide();
          await sleep(200);
          snackbarStore.show({
            message: lang.afterUnFollowTip,
            duration: 5000,
          });
        } catch (err) {
          console.error(err);
          snackbarStore.show({
            message: lang.somethingWrong,
            type: 'error',
          });
        }
      },
    });
  };

  const follow = (publisher: string) => {
    handleMenuClose();
    confirmDialogStore.show({
      content: lang.confirmToUnBan,
      okText: lang.yes,
      ok: async () => {
        try {
          await activeGroupStore.follow(offChainDatabase, {
            groupId: activeGroupStore.id,
            publisher,
          });
          confirmDialogStore.hide();
          await sleep(200);
          snackbarStore.show({
            message: lang.settingDone,
            duration: 1000,
          });
        } catch (err) {
          console.error(err);
          snackbarStore.show({
            message: lang.somethingWrong,
            type: 'error',
          });
        }
      },
    });
  };

  const ban = (publisher: string) => {
    handleMenuClose();
    confirmDialogStore.show({
      content: lang.confirmToBan,
      okText: lang.yes,
      ok: async () => {
        try {
          await DeniedListApi.submitDeniedList({
            peer_id: publisher,
            group_id: activeGroup.group_id,
            action: 'add',
          });
          confirmDialogStore.hide();
          await sleep(200);
          snackbarStore.show({
            message: lang.submittedWaitForSync,
            duration: 2500,
          });
        } catch (err) {
          console.error(err);
          snackbarStore.show({
            message: lang.somethingWrong,
            type: 'error',
          });
        }
      },
    });
  };

  const allow = (publisher: string) => {
    handleMenuClose();
    confirmDialogStore.show({
      content: lang.confirmToDelDenied,
      okText: lang.yes,
      ok: async () => {
        try {
          await DeniedListApi.submitDeniedList({
            peer_id: publisher,
            group_id: activeGroup.group_id,
            action: 'del',
          });
          confirmDialogStore.hide();
          await sleep(200);
          snackbarStore.show({
            message: lang.submittedWaitForSync,
            duration: 2500,
          });
        } catch (err) {
          console.error(err);
          snackbarStore.show({
            message: lang.somethingWrong,
            type: 'error',
          });
        }
      },
    });
  };

  const openTrxModal = () => {
    handleMenuClose();
    state.showTrxModal = true;
  };

  const closeTrxModal = () => {
    state.showTrxModal = false;
  };

  return (
    <div>
      <div
        className="text-gray-af px-[2px] opacity-80 cursor-pointer mt-[-3px]"
        onClick={handleMenuClick}
      >
        <RiMoreFill className="text-20" />
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
            margin: '27px 0 0 20px',
          },
        }}
      >
        <MenuItem onClick={() => openTrxModal()}>
          <div className="flex items-center text-gray-600 leading-none pl-1 py-2 font-bold pr-5">
            <span className="flex items-center mr-3">
              <MdInfoOutline className="text-18 opacity-50" />
            </span>
            {lang.info}
          </div>
        </MenuItem>
        {activeGroup.user_pubkey !== object.Publisher && (
          <div>
            {!activeGroupStore.unFollowingSet.has(object.Publisher) && (
              <MenuItem onClick={() => unFollow(object.Publisher)}>
                <div className="flex items-center text-red-400 leading-none pl-1 py-2 font-bold pr-2">
                  <span className="flex items-center mr-3">
                    <HiOutlineBan className="text-18 opacity-50" />
                  </span>
                  <span>{lang.unFollowHim}</span>
                </div>
              </MenuItem>
            )}
            {activeGroupStore.unFollowingSet.has(object.Publisher) && (
              <MenuItem onClick={() => follow(object.Publisher)}>
                <div className="flex items-center text-green-500 leading-none pl-1 py-2 font-bold pr-2">
                  <span className="flex items-center mr-3">
                    <HiOutlineCheckCircle className="text-18 opacity-80" />
                  </span>
                  <span>{lang.followHim}</span>
                </div>
              </MenuItem>
            )}
          </div>
        )}
        {isGroupOwner
          && activeGroup.user_pubkey !== object.Publisher && (
          <div>
            {!authStore.deniedListMap[
              `groupId:${activeGroup.group_id}|peerId:${object.Publisher}`
            ] && (
              <MenuItem onClick={() => ban(object.Publisher)}>
                <div className="flex items-center text-red-400 leading-none pl-1 py-2 font-bold pr-2">
                  <span className="flex items-center mr-3">
                    <HiOutlineBan className="text-18 opacity-50" />
                  </span>
                  <span>{lang.ban}</span>
                </div>
              </MenuItem>
            )}
            {authStore.deniedListMap[
              `groupId:${activeGroup.group_id}|peerId:${object.Publisher}`
            ] && (
              <MenuItem onClick={() => allow(object.Publisher)}>
                <div className="flex items-center text-green-500 leading-none pl-1 py-2 font-bold pr-2">
                  <span className="flex items-center mr-3">
                    <HiOutlineCheckCircle className="text-18 opacity-80" />
                  </span>
                  <span>{lang.unBan}</span>
                </div>
              </MenuItem>
            )}
          </div>
        )}
      </Menu>
      <TrxModal
        trxId={object.TrxId}
        open={state.showTrxModal}
        onClose={closeTrxModal}
      />
    </div>
  );
});
