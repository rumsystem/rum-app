import React from 'react';
import classNames from 'classnames';
import { action, reaction, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { sum } from 'lodash';
import escapeStringRegexp from 'escape-string-regexp';
import { Badge, Tooltip } from '@material-ui/core';
import { useStore } from 'store';
import getSortedGroups from 'store/selectors/getSortedGroups';
import { lang } from 'utils/lang';
import { assetsBasePath } from 'utils/env';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';
import ProducerApi, { IApprovedProducer } from 'apis/producer';
import TimelineIcon from 'assets/template/template_icon_timeline.svg?react';
import PostIcon from 'assets/template/template_icon_post.svg?react';
import NotebookIcon from 'assets/template/template_icon_notebook.svg?react';
import { GroupPopup } from './GroupPopup';
import { IGroup } from 'apis/group';
import Toolbar from './Toolbar';

interface Props {
  className?: string
}

export default observer((props: Props) => {
  const {
    activeGroupStore,
    groupStore,
    latestStatusStore,
    sidebarStore,
  } = useStore();
  const state = useLocalObservable(() => ({
    groupTypeFilter: 'all' as 'all' | GROUP_TEMPLATE_TYPE,
    searchText: '',

    producers: [] as Array<{ producers: Array<IApprovedProducer>, groupId: string }>,

    get groups() {
      const sortedGroups = getSortedGroups(groupStore.groups, latestStatusStore.map);
      const filteredGroups = sortedGroups.filter((v) => {
        if (state.searchText) {
          const reg = new RegExp(escapeStringRegexp(state.searchText), 'i');
          return reg.test(v.group_name);
        }
        if (state.groupTypeFilter === 'all') {
          return true;
        }
        return v.app_key === this.groupTypeFilter;
      });
      return filteredGroups.map((v) => ({
        ...v,
        isOwner: v.owner_pubkey === v.user_pubkey,
        isProducer: state.producers
          .find((u) => u.groupId === v.group_id)
          ?.producers.some((w) => w.ProducerPubkey === v.user_pubkey) ?? false,
      }));
    },
    get totalUnreadCount() {
      return groupStore.groups
        .map((group) => {
          const latestStatus = latestStatusStore.map[group.group_id] || latestStatusStore.DEFAULT_LATEST_STATUS;
          return latestStatus.unreadCount;
        })
        .reduce((p, c) => p + c, 0);
    },
  }));

  const handleOpenGroup = (groupId: string) => {
    if (activeGroupStore.switchLoading) {
      return;
    }

    if (activeGroupStore.id !== groupId) {
      activeGroupStore.setSwitchLoading(true);
      activeGroupStore.setId(groupId);
    }
  };

  React.useEffect(() => {
    let timer = 0;
    let stop = false;
    let running = false;
    const pollingProducers = async () => {
      if (stop) {
        return;
      }
      running = true;
      const producers = await Promise.all(state.groups.map(async (v) => ({
        producers: await ProducerApi.fetchApprovedProducers(v.group_id) ?? [],
        groupId: v.group_id,
      })));
      runInAction(() => {
        state.producers = producers;
      });
      timer = window.setTimeout(pollingProducers, 10000);
      running = false;
    };
    timer = window.setTimeout(pollingProducers, 0);
    const dispose = reaction(
      () => state.groups.length,
      () => {
        if (!running) {
          window.clearTimeout(timer);
          pollingProducers();
        }
      },
    );
    return () => {
      stop = true;
      dispose();
    };
  }, []);

  return (
    <div className={classNames('sidebar-box relative', props.className)}>
      <div
        className={classNames(
          'sidebar-toggle flex justify-center items-center h-15',
          'absolute right-0 translate-x-full -translate-y-10 top-1/2',
          'bg-white z-10 rounded-r-xl cursor-pointer',
          sidebarStore.collapsed && !!state.totalUnreadCount && 'w-[48px]',
          (!sidebarStore.collapsed || !state.totalUnreadCount) && 'w-[20px]',
        )}
        onClick={() => sidebarStore.toggle()}
      >
        {sidebarStore.collapsed && !!state.totalUnreadCount && (
          <div
            className={classNames(
              'flex items-center justify-center rounded-[10px] h-5 mr-1 px-1',
              'text-11 min-w-[20px] bg-black text-white',
            )}
          >
            {state.totalUnreadCount > 99 ? '99+' : state.totalUnreadCount}
          </div>
        )}
        <img
          className={classNames(
            !sidebarStore.collapsed && 'rotate-180',
          )}
          width="8"
          src={`${assetsBasePath}/fold.svg`}
          alt=""
        />
      </div>
      <div
        className={classNames(
          sidebarStore.collapsed && 'hidden',
          'sidebar w-[280px] relative flex flex-col h-full z-20 bg-white',
        )}
      >
        <Toolbar
          groupTypeFilter={state.groupTypeFilter}
          setGroupTypeFilter={(value: 'all' | GROUP_TEMPLATE_TYPE) => {
            state.groupTypeFilter = value;
          }}
          searchText={state.searchText}
          setSearchText={(value: string) => {
            state.searchText = value;
          }}
        />
        <div className="flex-1 overflow-y-auto">
          {state.groups.map((group) => (
            <GroupItem
              group={group}
              key={group.group_id}
              onOpen={() => handleOpenGroup(group.group_id)}
              highlight={state.searchText ? state.searchText : ''}
            />
          ))}
          {state.groups.length === 0 && (
            <div className="animate-fade-in pt-20 text-gray-400 opacity-80 text-center">
              {state.searchText ? lang.noSeedNetSearchResult : lang.noTypeGroups}
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
      .sidebar {
        box-shadow: 3px 0 6px 0 rgba(0, 0, 0, 0.16);
      }
      .sidebar-toggle {
        box-shadow: 0 1px 6px 0 rgba(0, 0, 0, 0.16);
      }
    `}</style>
    </div>
  );
});

interface GroupItemProps {
  group: IGroup & {
    isOwner: boolean
    isProducer: boolean
  }
  highlight: string
  onOpen: () => unknown
}

const GroupItem = observer((props: GroupItemProps) => {
  const state = useLocalObservable(() => ({
    tooltipOpen: false,
    openTimeoutId: 0,
  }));
  const {
    activeGroupStore,
    groupStore,
    latestStatusStore,
  } = useStore();

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

  const latestStatus = latestStatusStore.map[props.group.group_id] || latestStatusStore.DEFAULT_LATEST_STATUS;
  const isCurrent = activeGroupStore.id === props.group.group_id;
  const unreadCount = latestStatus.unreadCount;
  const GroupIcon = {
    [GROUP_TEMPLATE_TYPE.TIMELINE]: TimelineIcon,
    [GROUP_TEMPLATE_TYPE.POST]: PostIcon,
    [GROUP_TEMPLATE_TYPE.NOTE]: NotebookIcon,
  }[props.group.app_key] || TimelineIcon;

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
            {props.group.isProducer && <div className="flex-1 bg-producer-blue" />}
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
                ) === 0 && !groupStore.hasAnnouncedProducersMap[props.group.group_id])
              }
              variant="dot"
            />
          </div>
        </div>
      </div>
    </Tooltip>
  );
});
