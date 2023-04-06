import React from 'react';
import { format } from 'date-fns';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { FiDelete } from 'react-icons/fi';
import { MdInfoOutline } from 'react-icons/md';
import { ClickAwayListener, ClickAwayListenerProps } from '@material-ui/core';

import GroupApi, { IGroup } from 'apis/group';
import useDatabase from 'hooks/useDatabase';
import * as PostModel from 'hooks/useDatabase/models/posts';
import * as ProfileModel from 'hooks/useDatabase/models/profile';
import { useLeaveGroup } from 'hooks/useLeaveGroup';
import { useStore } from 'store';
import Avatar from 'components/Avatar';
import { groupInfo } from 'standaloneModals/groupInfo';
import { lang } from 'utils/lang';
import { GROUP_CONFIG_KEY } from 'utils/constant';
import sleep from 'utils/sleep';
import { getGroupIcon } from 'utils/getGroupIcon';
import { isGroupOwner } from 'store/selectors/group';

interface Props {
  group: IGroup
  onClose: () => void
  onClickAway: ClickAwayListenerProps['onClickAway']
}

export const GroupPopup = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    profile: null as ProfileModel.IDBProfileRaw | null,
    createdTime: 0,
  }));
  const db = useDatabase();
  const leaveGroup = useLeaveGroup();
  // const checkWallet = useCheckWallet();
  const { confirmDialogStore, latestStatusStore, groupStore } = useStore();
  const getData = async () => {
    const [user, post] = await db.transaction(
      'r',
      db.profiles,
      db.posts,
      () => Promise.all([
        ProfileModel.get(db, {
          groupId: props.group.group_id,
          publisher: props.group.user_pubkey,
          raw: true,
          useFallback: true,
        }),
        PostModel.getFirstPost(db, props.group.group_id),
      ]),
    );
    state.profile = user;
    state.createdTime = (post?.timestamp ?? 0) / 1000000;
  };
  const isOwner = isGroupOwner(props.group);

  const handleLeaveGroup = () => {
    let confirmText = '';
    // const valid = await checkWallet(props.group);
    // if (!valid) {
    //   confirmText += `<span class="text-red-400 font-bold">${lang.walletNoEmpty}</span><br/>`;
    // }
    const latestStatus = latestStatusStore.map[props.group.group_id] || latestStatusStore.DEFAULT_LATEST_STATUS;
    if (latestStatus.producerCount === 1 && isOwner) {
      confirmText = lang.singleProducerConfirm;
    }
    confirmText += lang.confirmToExit;
    confirmDialogStore.show({
      content: `<div>${confirmText}</div>`,
      okText: lang.leaveThisSeedNet,
      isDangerous: true,
      maxWidth: 340,
      checkText: lang.cleanUpHistoryData,
      ok: async (checked) => {
        if (confirmDialogStore.loading) {
          return;
        }
        confirmDialogStore.setLoading(true);
        await leaveGroup(props.group.group_id);
        if (checked) {
          await GroupApi.clearGroup(props.group.group_id);
        }
        confirmDialogStore.hide();
      },
    });
  };

  React.useEffect(() => {
    getData().catch(console.error);
  }, []);

  const GroupTypeIcon = getGroupIcon(props.group.app_key);
  const groupDesc = (groupStore.configMap.get(props.group.group_id)?.[GROUP_CONFIG_KEY.GROUP_DESC] ?? '') as string;

  return (
    <ClickAwayListener
      onClickAway={props.onClickAway}
      mouseEvent="onMouseDown"
    >
      <div className="shadow-3 w-[400px] border-black border text-white">
        <div className="flex items-center bg-black h-[50px] px-4">
          <GroupTypeIcon
            className="text-white ml-1 mr-2 mt-[2px] flex-none"
            width="20"
          />
          <div className="flex-1 text-16 truncate">
            {props.group.group_name}
          </div>
          {!!state.createdTime && (
            <div className="flex-none text-gray-9c ml-2">
              创建于 {format(state.createdTime, 'yyyy/MM/dd')}
            </div>
          )}
        </div>
        <div className="flex bg-white text-black">
          <div className="flex flex-col justify-center flex-1 p-4">
            {groupDesc && (
              <div className="text-gray-9c text-12 pb-3 leading-normal">
                {groupDesc}
              </div>
            )}
            <div className="flex items-center justify-center">
              <Avatar
                className="flex-none"
                size={44}
                avatar={state.profile?.avatar ?? ''}
              />
              <div className="text-14 flex-1 ml-3">
                <div className="text-14 flex items-center opacity-80">
                  <div className="truncate flex-1 w-0 mt-[2px]">
                    {state.profile?.name}
                  </div>
                </div>
                {isOwner && (
                  <div className="text-gray-9c mt-[6px] text-12">
                    {[
                      isOwner && `[${lang.owner}]`,
                    ].filter(Boolean).join(' ')}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex-none text-16 bg-gray-f2 py-3 select-none">
            <div
              className="flex items-center px-6 py-3 hover:bg-gray-ec cursor-pointer"
              onClick={async () => {
                props.onClose();
                await sleep(300);
                groupInfo(props.group);
              }}
            >
              <MdInfoOutline className="text-18 text-gray-600 opacity-50  mr-3" />
              <span>{lang.info}</span>
            </div>
            <div
              className="flex items-center px-6 py-3 hover:bg-gray-ec cursor-pointer"
              onClick={async () => {
                props.onClose();
                await sleep(300);
                handleLeaveGroup();
              }}
            >
              <FiDelete className="text-16 text-red-400 opacity-50 ml-px mr-3" />
              <span className="text-red-400 ml-px">{lang.exitGroupShort}</span>
            </div>
          </div>
        </div>
      </div>
    </ClickAwayListener>
  );
});
