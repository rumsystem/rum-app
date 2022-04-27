import React from 'react';
import classNames from 'classnames';
import { action, reaction, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { sum } from 'lodash';
import { MdArrowDropDown, MdClose, MdMoreVert, MdSearch } from 'react-icons/md';
import { MenuItem, Badge, MenuList, Popover, Input, Tooltip } from '@material-ui/core';

import { useStore } from 'store';
import getSortedGroups from 'store/selectors/getSortedGroups';
import { lang } from 'utils/lang';
import { assetsBasePath } from 'utils/env';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';
import ProducerApi, { IApprovedProducer } from 'apis/producer';
import { joinGroup } from 'standaloneModals/joinGroup';
import { createGroup } from 'standaloneModals/createGroup';
import TimelineIcon from 'assets/template/template_icon_timeline.svg?react';
import PostIcon from 'assets/template/template_icon_post.svg?react';
import NotebookIcon from 'assets/template/template_icon_notebook.svg?react';
import { getFirstBlock } from 'hooks/useDatabase/models/object';
import useDatabase from 'hooks/useDatabase';
import { GroupPopup } from './GroupPopup';

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
  const db = useDatabase();
  const state = useLocalObservable(() => ({
    menu: false,
    filterMenu: false,
    searchMode: false,

    groupTypeFilter: 'all' as 'all' | GROUP_TEMPLATE_TYPE,
    searchInput: '',

    groupCreateTimeMap: new Map<string, number>(),

    producers: [] as Array<{ producers: Array<IApprovedProducer>, groupId: string }>,

    get groups() {
      const sortedGroups = getSortedGroups(groupStore.groups, latestStatusStore.map);
      const filteredGroups = sortedGroups.filter((v) => {
        if (state.searchMode) {
          return v.group_name.includes(state.searchInput);
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
  const menuButton = React.useRef<HTMLDivElement>(null);
  const filterButton = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleOpenGroup = (groupId: string) => {
    if (activeGroupStore.switchLoading) {
      return;
    }

    if (activeGroupStore.id !== groupId) {
      activeGroupStore.setSwitchLoading(true);
      activeGroupStore.setId(groupId);
    }
  };

  const getGroupCreateTime = async (groupId: string) => {
    const time = state.groupCreateTimeMap.get(groupId);
    if (time) {
      return;
    }
    const block = await getFirstBlock(db, groupId);
    if (block) {
      state.groupCreateTimeMap.set(groupId, block.TimeStamp / 1000000);
    }
  };

  const handleFilterMenuClick = action(() => { state.filterMenu = true; });
  const handleFilterMenuClose = action(() => { state.filterMenu = false; });
  const handleMenuClick = action(() => { state.menu = true; });
  const handleMenuClose = action(() => { state.menu = false; });
  const handleOpenSearchMode = action(() => {
    state.searchMode = true;
    setTimeout(() => {
      inputRef.current?.focus();
    });
  });
  const handleCloseSearchMode = action(() => { state.searchMode = false; state.searchInput = ''; });

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

  const filterOptions = new Map<'all' | GROUP_TEMPLATE_TYPE, string>([
    ['all', lang.all],
    [GROUP_TEMPLATE_TYPE.TIMELINE, lang.sns],
    [GROUP_TEMPLATE_TYPE.POST, lang.forum],
    [GROUP_TEMPLATE_TYPE.NOTE, lang.note],
  ]);

  return (<>
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
        <div className="flex items-center justify-between h-[70px] border-b border-gray-ec">
          {!state.searchMode && (<>
            <div className="flex items-center text-16 ml-4">
              <div
                className="cursor-pointer flex items-center border-b pb-px"
                onClick={handleFilterMenuClick}
                ref={filterButton}
              >
                <span className="text-gray-6f mr-1">
                  {state.groupTypeFilter === 'all' && lang.allSeedNets}
                  {state.groupTypeFilter !== 'all' && filterOptions.get(state.groupTypeFilter)}
                </span>
                <MdArrowDropDown className="text-24" />
              </div>
            </div>

            <div className="flex items-center text-gray-1e mr-2">
              <div
                className="mr-3 cursor-pointer"
                onClick={handleOpenSearchMode}
              >
                <MdSearch className="text-30" />
              </div>

              <div
                className="mr-2 cursor-pointer"
                onClick={handleMenuClick}
                ref={menuButton}
              >
                <img src={`${assetsBasePath}/button_add_menu.svg`} alt="" width="24" height="24" />
              </div>
            </div>
          </>)}

          {state.searchMode && (<>
            <MdSearch className="text-30 ml-2" />
            <Input
              inputRef={inputRef}
              className="mt-0 flex-1 ml-3 mr-1 px-px"
              value={state.searchInput}
              onChange={action((e) => { state.searchInput = e.target.value; })}
            />
            <div className="p-2 cursor-pointer mr-1" onClick={handleCloseSearchMode}>
              <MdClose className="text-16" />
            </div>
          </>)}
        </div>

        <div className="flex-1 overflow-y-auto">
          {state.groups.map((group) => {
            const latestStatus = latestStatusStore.map[group.group_id] || latestStatusStore.DEFAULT_LATEST_STATUS;
            const isCurrent = activeGroupStore.id === group.group_id;
            const unreadCount = latestStatus.unreadCount;
            const GroupIcon = {
              [GROUP_TEMPLATE_TYPE.TIMELINE]: TimelineIcon,
              [GROUP_TEMPLATE_TYPE.POST]: PostIcon,
              [GROUP_TEMPLATE_TYPE.NOTE]: NotebookIcon,
            }[group.app_key] || TimelineIcon;
            return (
              <Tooltip
                classes={{ tooltip: 'm-0 p-0' }}
                enterDelay={1000}
                enterNextDelay={1000}
                placement="right"
                interactive
                key={group.group_id}
                onOpen={() => getGroupCreateTime(group.group_id)}
                title={(
                  <GroupPopup group={group} />
                )}
              >
                <div
                  className="cursor-pointer"
                  onClick={() => handleOpenGroup(group.group_id)}
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
                      {group.isProducer && <div className="flex-1 bg-producer-blue" />}
                      {group.isOwner && <div className="flex-1 bg-owner-cyan" />}
                    </div>
                    <div className="flex items-center truncate">
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
                        {(!state.searchMode || !state.searchInput) && group.group_name}
                        {state.searchMode && !!state.searchInput && group.group_name.split(state.searchInput).flatMap((v) => [
                          { type: 'text', value: v },
                          { type: 'highlight', value: state.searchInput },
                        ]).slice(0, -1).map((v, i) => (
                          <span
                            className={classNames(v.type === 'highlight' && 'text-highlight-green')}
                            key={i}
                          >
                            {v.value}
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
                          ) === 0 && !groupStore.hasAnnouncedProducersMap[group.group_id])
                        }
                        variant="dot"
                      />
                    </div>
                  </div>
                </div>
              </Tooltip>
            );
          })}
          {state.groups.length === 0 && (
            <div className="animate-fade-in pt-20 text-gray-400 opacity-80 text-center">
              {state.searchMode ? lang.noSeedNetSearchResult : lang.noTypeGroups}
            </div>
          )}
        </div>
      </div>
    </div>

    <Popover
      open={state.menu}
      onClose={handleMenuClose}
      anchorEl={menuButton.current}
      PaperProps={{
        className: 'bg-gray-33 text-white font-medium mt-2',
        square: true,
        elevation: 2,
      }}
      anchorOrigin={{
        horizontal: 'center',
        vertical: 'bottom',
      }}
      transformOrigin={{
        horizontal: 'center',
        vertical: 'top',
      }}
    >
      <MenuList>
        <MenuItem
          className="py-3 px-6 hover:bg-gray-4a"
          onClick={() => {
            handleMenuClose();
            joinGroup();
          }}
        >
          <img
            className="text-14 mr-4"
            src={`${assetsBasePath}/icon_addseed.svg`}
            alt=""
          />
          <span className="text-16">{lang.joinGroup}</span>
        </MenuItem>
        <MenuItem
          className="py-3 px-6 hover:bg-gray-4a"
          onClick={() => {
            handleMenuClose();
            createGroup();
          }}
        >
          <img
            className="text-14 mr-4"
            src={`${assetsBasePath}/icon_addanything.svg`}
            alt=""
          />
          <span className="text-16">{lang.createGroup}</span>
        </MenuItem>
      </MenuList>
    </Popover>

    <Popover
      open={state.filterMenu}
      onClose={handleFilterMenuClose}
      anchorEl={filterButton.current}
      PaperProps={{
        className: 'min-w-[140px] mt-2',
        style: {
          borderRadius: '4px',
        },
        square: true,
        elevation: 2,
      }}
      anchorOrigin={{
        horizontal: 'center',
        vertical: 'bottom',
      }}
      transformOrigin={{
        horizontal: 'center',
        vertical: 'top',
      }}
    >
      <MenuList>
        {Array.from(filterOptions.entries()).map(([k, v]) => (
          <MenuItem
            className="py-1"
            key={k}
            onClick={action(() => {
              state.groupTypeFilter = k;
              handleFilterMenuClose();
            })}
          >
            <span className="text-16">{v}</span>
          </MenuItem>
        ))}
      </MenuList>
    </Popover>

    <style jsx>{`
      .sidebar {
        box-shadow: 3px 0 6px 0 rgba(0, 0, 0, 0.16);
      }
      .sidebar-toggle {
        box-shadow: 0 1px 6px 0 rgba(0, 0, 0, 0.16);
      }
    `}</style>
  </>);
});
