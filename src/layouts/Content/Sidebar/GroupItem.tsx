import React from 'react';
import classNames from 'classnames';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { sum } from 'lodash';
import escapeStringRegexp from 'escape-string-regexp';
import { Badge, Tooltip } from '@material-ui/core';
import { useStore } from 'store';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';
import TimelineIcon from 'assets/template/template_icon_timeline.svg?react';
import PostIcon from 'assets/template/template_icon_post.svg?react';
import NotebookIcon from 'assets/template/template_icon_notebook.svg?react';
import { GroupPopup } from './GroupPopup';
import { IGroup } from 'apis/group';
import GroupIcon from 'components/GroupIcon';
import { ListType } from './ListTypeSwitcher';

interface GroupItemProps {
  group: IGroup & {
    isOwner: boolean
  }
  highlight: string
  listType: ListType
  onOpen: () => unknown
}

export default observer((props: GroupItemProps) => {
  const state = useLocalObservable(() => ({
    tooltipOpen: false,
    openTimeoutId: 0,
  }));
  const {
    activeGroupStore,
    latestStatusStore,
  } = useStore();

  const { group } = props;
  const latestStatus = latestStatusStore.map[group.group_id] || latestStatusStore.DEFAULT_LATEST_STATUS;
  const unreadCount = latestStatus.unreadCount;
  const isCurrent = activeGroupStore.id === group.group_id;
  const GroupTypeIcon = {
    [GROUP_TEMPLATE_TYPE.TIMELINE]: TimelineIcon,
    [GROUP_TEMPLATE_TYPE.POST]: PostIcon,
    [GROUP_TEMPLATE_TYPE.NOTE]: NotebookIcon,
  }[group.app_key] || TimelineIcon;
  const isTextListType = props.listType === ListType.text;
  const isIconListType = props.listType === ListType.icon;

  const handleClick = () => {
    props.onOpen();
    window.clearTimeout(state.openTimeoutId);
  };

  const handleMouseEnter = action(() => {
    window.clearTimeout(state.openTimeoutId);
    if (state.tooltipOpen) {
      return;
    }
    state.openTimeoutId = window.setTimeout(action(() => {
      state.tooltipOpen = true;
    }), 1000);
  });

  const handleMouseLeave = action(() => {
    window.clearTimeout(state.openTimeoutId);
    if (!state.tooltipOpen) {
      return;
    }
    state.openTimeoutId = window.setTimeout(action(() => {
      state.tooltipOpen = false;
    }), 200);
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

  return (
    <Tooltip
      classes={{ tooltip: 'm-0 p-0' }}
      enterDelay={0}
      leaveDelay={0}
      open={state.tooltipOpen}
      placement="right"
      interactive
      key={group.group_id}
      title={(
        <GroupPopup
          group={group}
          boxProps={{
            onMouseEnter: handleMouseEnter,
            onMouseLeave: handleMouseLeave,
          }}
        />
      )}
    >
      <div
        className="cursor-pointer"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {isIconListType && (
          <div className="border border-black rounded-4 px-[6px] pt-[12px] pb-[9px] relative">
            <GroupIcon width={48} height={48} fontSize={26} groupId={group.group_id} className="rounded-12 mx-auto" />
            <div className="mt-[6px] font-medium text-12 text-center max-2-lines text-gray-33">
              {!props.highlight && group.group_name}
              {!!props.highlight && highlightGroupName(group.group_name, props.highlight).map((v, i) => (
                <span className={classNames(v.type === 'highlight' && 'text-highlight-green')} key={i}>
                  {v.text}
                </span>
              ))}
            </div>
            {group.isOwner && <div className="absolute top-[20px] left-[-2px] h-8 w-[3px] bg-owner-cyan" />}
            {/* <div className="bg-black rounded-2 flex items-center justify-center leading-none text-white text-12 absolute top-[-1px] right-[-1px] py-[2px] px-[3px] transform scale-90">
              20
            </div> */}
            {/* <div className="rounded-2 flex items-center justify-center leading-none text-gray-99 text-12 absolute top-[-1px] right-[-1px] py-[2px] px-[3px] transform scale-90">
              20
            </div> */}
            <div className="rounded-2 flex items-center justify-center leading-none text-gray-99 absolute top-0 right-0">
              <GroupTypeIcon
                className={classNames(
                  'flex-none opacity-90',
                  isCurrent && 'text-white',
                  !isCurrent && 'text-gray-9c',
                )}
                style={{
                  strokeWidth: 4,
                }}
                width="14"
              />
            </div>
            <style jsx>{`
              .max-2-lines {
                overflow: hidden;
                text-overflow: ellipsis;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                display: -webkit-box;
              }
            `}</style>
          </div>
        )}

        {isTextListType && (
          <div
            className={classNames(
              'flex justify-between items-center leading-none h-[50px] px-3',
              'text-14 relative pointer-events-none',
              isCurrent && 'bg-black text-white',
              !isCurrent && 'bg-white text-black',
            )}
          >
            <div
              className={classNames(
                'w-[6px] h-full flex flex-col items-stretch absolute left-0',
                !isCurrent && 'py-px',
              )}
            >
              {group.isOwner && <div className="flex-1 bg-owner-cyan" />}
            </div>
            <div className="flex items-center">
              <GroupIcon width={24} height={24} fontSize={14} groupId={group.group_id} colorClassName={isCurrent ? 'text-gray-33' : ''} className="rounded-5 mr-2 w-6" />
              <div className="py-1 font-medium truncate max-w-42 text-14">
                {!props.highlight && group.group_name}
                {!!props.highlight && highlightGroupName(group.group_name, props.highlight).map((v, i) => (
                  <span className={classNames(v.type === 'highlight' && 'text-highlight-green')} key={i}>
                    {v.text}
                  </span>
                ))}
              </div>
              <GroupTypeIcon
                className={classNames(
                  'ml-[5px] flex-none opacity-90',
                  isCurrent && 'text-white',
                  !isCurrent && 'text-gray-9c',
                )}
                style={{
                  strokeWidth: 4,
                }}
                width="16"
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
                invisible={
                  isCurrent
                  || unreadCount > 0
                  || (sum(
                    Object.values(
                      latestStatus.notificationUnreadCountMap || {},
                    ),
                  ) === 0)
                }
                variant="dot"
              />
            </div>
          </div>
        )}
      </div>
    </Tooltip>
  );
});
