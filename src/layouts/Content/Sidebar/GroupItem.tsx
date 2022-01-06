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

interface GroupItemProps {
  group: IGroup & {
    isOwner: boolean
  }
  highlight: string
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

  const latestStatus = latestStatusStore.map[props.group.group_id] || latestStatusStore.DEFAULT_LATEST_STATUS;
  const unreadCount = latestStatus.unreadCount;
  const isCurrent = activeGroupStore.id === props.group.group_id;
  const GroupIcon = {
    [GROUP_TEMPLATE_TYPE.TIMELINE]: TimelineIcon,
    [GROUP_TEMPLATE_TYPE.POST]: PostIcon,
    [GROUP_TEMPLATE_TYPE.NOTE]: NotebookIcon,
  }[props.group.app_key] || TimelineIcon;

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
      key={props.group.group_id}
      title={(
        <GroupPopup
          group={props.group}
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
            {props.group.isOwner && <div className="flex-1 bg-owner-cyan" />}
          </div>
          <div className="flex items-center truncate w-56">
            <GroupIcon
              className={classNames(
                'ml-1 mr-2 mt-[2px] flex-none',
                isCurrent && 'text-white',
                !isCurrent && 'text-gray-9c',
              )}
              style={{
                strokeWidth: 4,
              }}
              width="18"
            />
            <div className="py-1 font-medium truncate text-14">
              {!props.highlight && props.group.group_name}
              {!!props.highlight && highlightGroupName(props.group.group_name, props.highlight).map((v, i) => (
                <span className={classNames(v.type === 'highlight' && 'text-highlight-green')} key={i}>
                  {v.text}
                </span>
              ))}
            </div>
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
      </div>
    </Tooltip>
  );
});
