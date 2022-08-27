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
import { IProfile } from 'store/group';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';
import { lang } from 'utils/lang';
import TimelineIcon from 'assets/template/template_icon_timeline.svg?react';
import PostIcon from 'assets/template/template_icon_post.svg?react';
import NotebookIcon from 'assets/template/template_icon_notebook.svg?react';
import Avatar from 'components/Avatar';
import { groupInfo } from 'standaloneModals/groupInfo';

interface Props {
  group: IGroup & { isOwner: boolean, isProducer: boolean }
}

export const GroupPopup = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    profile: null as IProfile | null,
    createdTime: 0,
  }));
  const db = useDatabase();
  const leaveGroup = useLeaveGroup();
  const { confirmDialogStore, latestStatusStore } = useStore();
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

  const handleLeaveGroup = () => {
    let confirmText = '';
    const latestStatus = latestStatusStore.map[props.group.group_id] || latestStatusStore.DEFAULT_LATEST_STATUS;
    if (latestStatus.producerCount === 1 && props.group.isOwner) {
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

  const GroupIcon = {
    [GROUP_TEMPLATE_TYPE.TIMELINE]: TimelineIcon,
    [GROUP_TEMPLATE_TYPE.POST]: PostIcon,
    [GROUP_TEMPLATE_TYPE.NOTE]: NotebookIcon,
  }[props.group.app_key] || TimelineIcon;

  return (
    <div className="shadow-3 w-[500px]">
      <div className="flex items-center bg-black h-[50px] px-4">
        <GroupIcon
          className="text-white ml-1 mr-2 mt-[2px] flex-none"
          style={{ strokeWidth: 4 }}
          width="24"
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
        <div className="flex flex-1 justify-center items-center p-4">
          <Avatar
            className="flex-none"
            size={50}
            url={state.profile?.avatar ?? ''}
          />
          <div className="text-14 flex-1 ml-6">
            <div>{state.profile?.name}</div>
            {(props.group.isOwner || props.group.isProducer) && (
              <div className="text-gray-9c mt-2">
                {[
                  props.group.isOwner && '[创建者]',
                  props.group.isProducer && '[出块人]',
                ].filter(Boolean).join(' ')}
              </div>
            )}
          </div>
        </div>
        <div className="flex-none text-16 bg-gray-f2 py-3 select-none">
          <div
            className="flex items-center px-6 py-3 hover:bg-gray-ec cursor-pointer"
            onClick={() => groupInfo(props.group)}
          >
            <MdInfoOutline className="text-18 text-gray-600 opacity-50  mr-3" />
            <span>{lang.info}</span>
          </div>
          <div
            className="flex items-center px-6 py-3 hover:bg-gray-ec cursor-pointer"
            onClick={() => handleLeaveGroup()}
          >
            <FiDelete className="text-16 text-red-400 opacity-50 ml-px mr-3" />
            <span className="text-red-400 ml-px">{lang.exitGroupShort}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
