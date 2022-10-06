import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { Menu, MenuItem } from '@material-ui/core';
import { sleep } from 'utils';
import { HiOutlineBan, HiOutlineCheckCircle } from 'react-icons/hi';
import { RiMoreFill } from 'react-icons/ri';
import { MdInfoOutline } from 'react-icons/md';
import GroupApi, { IObjectItem } from 'apis/group';
import { useStore } from 'store';
import useIsGroupOwner from 'store/selectors/useIsGroupOwner';
import useActiveGroup from 'store/selectors/useActiveGroup';
import TrxModal from './TrxModal';

export default observer((props: { object: IObjectItem }) => {
  const { object } = props;
  const { nodeStore, authStore, snackbarStore, confirmDialogStore } =
    useStore();
  const activeGroup = useActiveGroup();
  const isCurrentGroupOwner = useIsGroupOwner(activeGroup);
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

  const ban = (publisher: string) => {
    handleMenuClose();
    confirmDialogStore.show({
      object: '确定禁止 Ta 发布内容？',
      okText: '确定',
      ok: async () => {
        try {
          await GroupApi.createBlacklist({
            type: 'Add',
            object: {
              type: 'Auth',
              id: publisher,
            },
            target: {
              id: activeGroup.GroupId,
              type: 'Group',
            },
          });
          confirmDialogStore.hide();
          await sleep(200);
          snackbarStore.show({
            message: '请求已提交，等待其他节点同步',
            duration: 2500,
          });
        } catch (err) {
          console.error(err);
          snackbarStore.show({
            message: '貌似出错了',
            type: 'error',
          });
        }
      },
    });
  };

  const allow = (publisher: string) => {
    handleMenuClose();
    confirmDialogStore.show({
      object: '确定允许 Ta 发布内容？',
      okText: '确定',
      ok: async () => {
        try {
          await GroupApi.createBlacklist({
            type: 'Remove',
            object: {
              type: 'Auth',
              id: publisher,
            },
            target: {
              id: activeGroup.GroupId,
              type: 'Group',
            },
          });
          confirmDialogStore.hide();
          await sleep(200);
          snackbarStore.show({
            message: '请求已提交，等待其他节点同步',
            duration: 2500,
          });
        } catch (err) {
          console.error(err);
          snackbarStore.show({
            message: '貌似出错了',
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
        className="absolute top-[8px] right-[8px] text-gray-9b p-2 opacity-80"
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
            详情
          </div>
        </MenuItem>
        {isCurrentGroupOwner &&
          nodeStore.info.node_publickey !== object.Publisher && (
            <div>
              {!authStore.blacklistMap[
                `groupId:${activeGroup.GroupId}|userId:${object.Publisher}`
              ] && (
                <MenuItem onClick={() => ban(object.Publisher)}>
                  <div className="flex items-center text-red-400 leading-none pl-1 py-2 font-bold pr-2">
                    <span className="flex items-center mr-3">
                      <HiOutlineBan className="text-18 opacity-50" />
                    </span>
                    <span>禁止 Ta 发布</span>
                  </div>
                </MenuItem>
              )}
              {authStore.blacklistMap[
                `groupId:${activeGroup.GroupId}|userId:${object.Publisher}`
              ] && (
                <MenuItem onClick={() => allow(object.Publisher)}>
                  <div className="flex items-center text-green-500 leading-none pl-1 py-2 font-bold pr-2">
                    <span className="flex items-center mr-3">
                      <HiOutlineCheckCircle className="text-18 opacity-80" />
                    </span>
                    <span>允许 Ta 发布</span>
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
