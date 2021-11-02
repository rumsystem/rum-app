import React from 'react';
import classNames from 'classnames';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { sum } from 'lodash';
import { MdArrowDropDown } from 'react-icons/md';
import { MenuItem, Badge, MenuList, Popover } from '@material-ui/core';
import { lang } from 'utils/lang';

import { useStore } from 'store';
import { assetsBasePath } from 'utils/env';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';
import { joinGroup } from 'standaloneModals/joinGroup';
import { createGroup } from 'standaloneModals/createGroup';
import getSortedGroups from 'store/selectors/getSortedGroups';
import TimelineIcon from 'assets/template/template_icon_timeline.svg?react';
import PostIcon from 'assets/template/template_icon_post.svg?react';
import NotebookIcon from 'assets/template/template_icon_notebook.svg?react';

interface Props {
  className?: string
}

const filterOptions = new Map<'all' | GROUP_TEMPLATE_TYPE, string>([
  ['all', lang.all],
  [GROUP_TEMPLATE_TYPE.TIMELINE, lang.sns],
  [GROUP_TEMPLATE_TYPE.POST, lang.forum],
  [GROUP_TEMPLATE_TYPE.NOTE, lang.note],
]);

export default observer((props: Props) => {
  const {
    activeGroupStore,
    groupStore,
    latestStatusStore,
    sidebarStore,
  } = useStore();
  const sortedGroups = getSortedGroups(groupStore.groups, latestStatusStore.map);
  const state = useLocalObservable(() => ({
    menu: false,
    filterMenu: false,

    groupTypeFilter: 'all' as 'all' | GROUP_TEMPLATE_TYPE,
  }));
  const menuButton = React.useRef<HTMLDivElement>(null);
  const filterButton = React.useRef<HTMLDivElement>(null);
  const filteredGroups = sortedGroups.filter((v) => {
    if (state.groupTypeFilter === 'all') {
      return true;
    }
    return v.app_key === state.groupTypeFilter;
  });

  const openGroup = (groupId: string) => {
    if (activeGroupStore.switchLoading) {
      return;
    }

    if (activeGroupStore.id !== groupId) {
      activeGroupStore.setSwitchLoading(true);
      activeGroupStore.setId(groupId);
    }
  };

  const handleFilterMenuClick = action(() => {
    state.filterMenu = true;
  });

  const handleFilterMenuClose = action(() => {
    state.filterMenu = false;
  });

  const handleMenuClick = action(() => {
    state.menu = true;
  });

  const handleMenuClose = action(() => {
    state.menu = false;
  });

  if (sidebarStore.collapsed) {
    return null;
  }

  return (
    <div className={classNames('sidebar relative flex flex-col', props.className)}>
      <div className="flex items-center justify-between h-[70px] border-b border-gray-ec">
        <div className="flex items-center text-16 ml-3">
          <div
            className="w-5 h-5 mr-4 flex justify-center items-center flex-none bg-gray-f2 rounded-full cursor-pointer"
            onClick={() => sidebarStore.collapse()}
          >
            <img className="rotate-180" src={`${assetsBasePath}/fold.svg`} alt="" />
          </div>
          <div
            className="cursor-pointer flex items-center"
            onClick={handleFilterMenuClick}
            ref={filterButton}
          >
            <span className="text-gray-1e">
              {state.groupTypeFilter === 'all' && lang.filterByType}
              {state.groupTypeFilter !== 'all' && filterOptions.get(state.groupTypeFilter)}
            </span>
            <MdArrowDropDown className="text-24" />
          </div>
        </div>

        <div
          className="mr-5 cursor-pointer"
          onClick={handleMenuClick}
          ref={menuButton}
        >
          <img src={`${assetsBasePath}/button_add_menu.svg`} alt="" width="24" height="24" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredGroups.map((group) => {
          const latestStatus = latestStatusStore.map[group.group_id] || latestStatusStore.DEFAULT_LATEST_STATUS;
          const isCurrent = activeGroupStore.id === group.group_id;
          const unreadCount = latestStatus.unreadCount;
          const GroupIcon = {
            [GROUP_TEMPLATE_TYPE.TIMELINE]: TimelineIcon,
            [GROUP_TEMPLATE_TYPE.POST]: PostIcon,
            [GROUP_TEMPLATE_TYPE.NOTE]: NotebookIcon,
          }[group.app_key] || TimelineIcon;
          return (
            <div key={group.group_id}>
              <div
                className={classNames(
                  'flex justify-between items-center leading-none h-[50px] px-3',
                  'text-14 cursor-pointer tracking-wider relative',
                  isCurrent && 'bg-black text-white',
                  !isCurrent && 'bg-white text-black',
                )}
                onClick={() => openGroup(group.group_id)}
              >
                <div className="flex items-center truncate">
                  <GroupIcon
                    className={classNames(
                      'mr-2 mt-[2px] flex-none',
                      isCurrent && 'text-white',
                      !isCurrent && 'text-gray-9c',
                    )}
                    style={{
                      strokeWidth: 4,
                    }}
                    width="18"
                  />
                  <div className="py-1 font-medium truncate text-14">
                    {group.group_name}
                  </div>
                </div>
                <div className="absolute top-0 right-0 h-full flex items-center mr-3">
                  <Badge
                    className="transform mr-1"
                    classes={{
                      badge: classNames(
                        isCurrent
                          && 'bg-white text-black',
                        !isCurrent
                          && 'bg-black text-white',
                      ),
                    }}
                    badgeContent={unreadCount}
                    invisible={!unreadCount}
                    variant="standard"
                  />
                  <Badge
                    className="transform scale-90 mr-2"
                    classes={{
                      badge: 'bg-red-500',
                    }}
                    invisible={
                      isCurrent
                      || unreadCount > 0
                      || sum(
                        Object.values(
                          latestStatus.notificationUnreadCountMap || {},
                        ),
                      ) === 0
                    }
                    variant="dot"
                  />
                </div>
              </div>
            </div>
          );
        })}
        {filteredGroups.length === 0 && (
          <div className="animate-fade-in pt-20 text-gray-400 opacity-80 text-center">
            {lang.noTypeGroups}
          </div>
        )}
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
      `}</style>
    </div>
  );
});
