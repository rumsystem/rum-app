import React from 'react';
import { format } from 'date-fns';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { FiDelete } from 'react-icons/fi';
import { MdInfoOutline } from 'react-icons/md';
import { IGroup } from 'apis/group';
import useDatabase from 'hooks/useDatabase';
import { getFirstBlock } from 'hooks/useDatabase/models/object';
import { getUser } from 'hooks/useDatabase/models/person';
import { useLeaveGroup } from 'hooks/useLeaveGroup';
import { useStore } from 'store';
import { IProfile } from 'apis/content';
import { lang } from 'utils/lang';
import TimelineIcon from 'assets/template/template_icon_timeline.svg?react';
import PostIcon from 'assets/template/template_icon_post.svg?react';
import NotebookIcon from 'assets/template/template_icon_notebook.svg?react';
import WalletIcon from 'assets/icon_wallet.svg?react';
import Avatar from 'components/Avatar';
import { groupInfo } from 'standaloneModals/groupInfo';
import { GROUP_CONFIG_KEY, GROUP_TEMPLATE_TYPE } from 'utils/constant';
import sleep from 'utils/sleep';

interface Props {
  group: IGroup
  boxProps: React.DOMAttributes<HTMLDivElement>
  onClose: () => void
}

export const GroupPopup = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    profile: null as IProfile | null,
    createdTime: 0,
  }));
  const db = useDatabase();
  const leaveGroup = useLeaveGroup();
  const { confirmDialogStore, latestStatusStore, groupStore } = useStore();
  const getData = async () => {
    const [user, block] = await db.transaction(
      'r',
      db.persons,
      db.objects,
      () => Promise.all([
        getUser(db, {
          GroupId: props.group.group_id,
          Publisher: props.group.user_pubkey,
        }),
        getFirstBlock(db, props.group.group_id),
      ]),
    );
    state.profile = user.profile;
    state.createdTime = (block?.TimeStamp ?? 0) / 1000000;
  };
  const isOwner = props.group.role === 'owner';

  const handleLeaveGroup = () => {
    let confirmText = '';
    const latestStatus = latestStatusStore.map[props.group.group_id] || latestStatusStore.DEFAULT_LATEST_STATUS;
    if (latestStatus.producerCount === 1 && isOwner) {
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
        leaveGroup(props.group.group_id).then(() => {
          confirmDialogStore.hide();
        }).finally(() => {
          confirmDialogStore.setLoading(false);
        });
      },
    });
  };

  React.useEffect(() => {
    getData().catch(console.error);
  }, []);

  const GroupTypeIcon = {
    [GROUP_TEMPLATE_TYPE.TIMELINE]: TimelineIcon,
    [GROUP_TEMPLATE_TYPE.POST]: PostIcon,
    [GROUP_TEMPLATE_TYPE.NOTE]: NotebookIcon,
  }[props.group.app_key] || TimelineIcon;
  const groupDesc = (groupStore.configMap.get(props.group.group_id)?.[GROUP_CONFIG_KEY.GROUP_DESC] ?? '') as string;

  return (
    <div className="shadow-3 w-[400px] border-black border" {...props.boxProps}>
      <div className="flex items-center bg-black h-[50px] px-4">
        <GroupTypeIcon
          className="text-white ml-1 mr-2 mt-[2px] flex-none"
          style={{ strokeWidth: 4 }}
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
              url={state.profile?.avatar ?? ''}
            />
            <div className="text-14 flex-1 ml-3">
              <div className="text-14 flex items-center opacity-80">
                <div className="truncate flex-1 w-0 mt-[2px]">
                  {state.profile?.name}
                </div>
                {!!state.profile?.mixinUID && (
                  <WalletIcon className="ml-2 flex-none" />
                )}
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
  );
});
