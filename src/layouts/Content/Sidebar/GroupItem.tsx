import React from 'react';
import classNames from 'classnames';
import { action, reaction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { sum } from 'lodash';
import escapeStringRegexp from 'escape-string-regexp';
import { Badge, Popover } from '@mui/material';

import { useStore } from 'store';
import { IGroup } from 'apis/group';
import GroupIcon from 'components/GroupIcon';
import { getGroupIcon } from 'utils/getGroupIcon';

import { GroupPopup } from './GroupPopup';
import { ListType } from './ListTypeSwitcher';
import { sortableState } from './sortableState';
import { isGroupOwner } from 'store/selectors/group';

interface GroupItemProps {
  group: IGroup
  highlight: string
  listType: ListType
}

export default observer((props: GroupItemProps) => {
  const state = useLocalObservable(() => ({
    groupPopupOpen: false,
  }));
  const {
    activeGroupStore,
    latestStatusStore,
  } = useStore();
  const boxRef = React.useRef<HTMLDivElement>(null);

  const { group } = props;
  const latestStatus = latestStatusStore.map[group.group_id] || latestStatusStore.DEFAULT_LATEST_STATUS;
  const unreadCount = latestStatus.unreadCount;
  const isCurrent = activeGroupStore.id === group.group_id;
  const GroupTypeIcon = getGroupIcon(group.app_key);
  const isTextListType = props.listType === ListType.text;
  const isIconListType = props.listType === ListType.icon;
  const showNotificationBadge = !isCurrent
    && unreadCount === 0
    && (sum(Object.values(latestStatus.notificationUnreadCountMap || {})) > 0);
  const isOwner = isGroupOwner(group);

  React.useEffect(() => reaction(
    () => [state.groupPopupOpen],
    () => {
      if (state.groupPopupOpen) {
        sortableState.disableSortable();
      } else {
        sortableState.enableSortable();
      }
    },
  ), []);

  const handleClick = () => {
    if (!activeGroupStore.switchLoading) {
      if (activeGroupStore.id !== group.group_id) {
        activeGroupStore.setSwitchLoading(true);
        activeGroupStore.setId(group.group_id);
      }
    }
  };

  const handleClose = action(() => {
    state.groupPopupOpen = false;
  });

  return (<>
    <div
      className="cursor-pointer"
      onContextMenu={action((e) => {
        e.preventDefault();
        state.groupPopupOpen = true;
      })}
      onClick={handleClick}
      key={group.group_id}
      ref={boxRef}
      data-test-id="sidebar-group-item"
    >
      {isIconListType && (
        <div className={classNames({
          'border border-black bg-white': isCurrent,
          'border border-gray-[#f9f9f9]': !isCurrent,
        }, 'rounded-4 px-[5px] pt-[12px] pb-2 relative')}
        >
          <GroupIcon width={48} height={48} fontSize={26} groupId={group.group_id} className="rounded-6 mx-auto" />
          <div className="mt-[7px] h-[24px] flex items-center">
            <div className="flex-1 font-medium text-12 text-center truncate-2 text-gray-33 leading-tight">
              {!props.highlight && group.group_name}
              {!!props.highlight && highlightGroupName(group.group_name, props.highlight).map((v, i) => (
                <span className={classNames(v.type === 'highlight' && 'text-highlight-green')} key={i}>
                  {v.text}
                </span>
              ))}
            </div>
          </div>
          {isOwner && <div className="absolute top-[20px] left-[-2px] h-8 w-[3px] bg-[#ff931e]" />}
          {unreadCount > 0 && !showNotificationBadge && (
            <div className='rounded-2 flex items-center justify-center leading-none text-12 absolute top-[-1px] right-[-1px] py-[2px] px-[3px] transform scale-90 min-w-[18px] text-center box-border text-gray-88 bg-[#f9f9f9]'>
              {unreadCount}
            </div>
          )}
          {showNotificationBadge && (
            <Badge
              className="transform scale-90 absolute top-2 right-2"
              classes={{
                badge: 'bg-red-500',
              }}
              invisible={false}
              variant="dot"
            />
          )}
          {unreadCount === 0 && !showNotificationBadge && (
            <div className="rounded-2 flex items-center justify-center leading-none text-gray-99 p-[1px] absolute top-0 right-0">
              <GroupTypeIcon
                className='flex-none opacity-90 text-gray-9c'
                width="14"
              />
            </div>
          )}
        </div>
      )}

      {isTextListType && (
        <div
          className={classNames(
            'flex justify-between items-center leading-none h-[44px] px-3',
            'text-14 relative pointer-events-none',
            isCurrent && 'bg-black text-white',
            !isCurrent && 'bg-white text-black',
          )}
        >
          <div
            className={classNames(
              'w-[3px] h-full flex flex-col items-stretch absolute left-0',
              !isCurrent && 'py-px',
            )}
          >
            {isOwner && <div className="flex-1 bg-[#ff931e]" />}
          </div>
          <div className="flex items-center">
            <GroupIcon width={24} height={24} fontSize={14} groupId={group.group_id} colorClassName={isCurrent ? 'text-gray-33' : ''} className="rounded-6 mr-2 w-6" />
            <div className="py-1 font-medium truncate max-w-38 text-14">
              {!props.highlight && group.group_name}
              {!!props.highlight && highlightGroupName(group.group_name, props.highlight).map((v, i) => (
                <span className={classNames(v.type === 'highlight' && 'text-highlight-green')} key={i}>
                  {v.text}
                </span>
              ))}
            </div>
            <GroupTypeIcon
              className={classNames(
                'ml-[6px] flex-none opacity-90',
                isCurrent && 'text-white',
                !isCurrent && 'text-gray-9c',
              )}
              width="14"
            />
          </div>
          <div className="absolute top-0 right-4 h-full flex items-center">
            <Badge
              className="transform mr-1"
              classes={{
                badge: classNames(
                  'bg-transparent tracking-tighter',
                  isCurrent && 'text-gray-af',
                  !isCurrent && 'text-gray-9c',
                ),
              }}
              badgeContent={unreadCount}
              invisible={!unreadCount}
              variant="standard"
              max={9999}
            />
            <Badge
              className="transform scale-90 mr-2"
              classes={{
                badge: 'bg-red-500',
              }}
              invisible={!showNotificationBadge}
              variant="dot"
            />
          </div>
        </div>
      )}
    </div>

    <Popover
      classes={{
        root: 'pointer-events-none',
        paper: 'pointer-events-auto',
      }}
      open={state.groupPopupOpen}
      onClose={handleClose}
      anchorEl={boxRef.current}
      anchorOrigin={{
        horizontal: 'right',
        vertical: 'center',
      }}
      transformOrigin={{
        horizontal: 'left',
        vertical: 'center',
      }}
    >
      <GroupPopup
        group={group}
        onClickAway={handleClose}
        onClose={handleClose}
      />
    </Popover>
  </>);
});

const highlightGroupName = (groupName: string, highlight: string) => {
  const reg = new RegExp(escapeStringRegexp(highlight), 'ig');
  const matches = Array.from(groupName.matchAll(reg)).map((v) => ({
    start: v.index!,
    end: v.index! + v[0].length,
  }));
  const sections = [
    { start: 0, end: matches.at(0)!.start, type: 'text' },
    ...matches.map((v) => ({ ...v, type: 'highlight' })),
    { start: matches.at(-1)!.end, end: groupName.length, type: 'text' },
  ].flatMap((v, i, a) => {
    const next = a[i + 1];
    if (next && next.start > v.end) {
      return [v, { start: v.end, end: next.start, type: 'text' }];
    }
    return v;
  }).map((v) => ({
    type: v.type,
    text: groupName.substring(v.start, v.end),
  }));
  return sections;
};
