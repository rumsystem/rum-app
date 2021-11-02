import React from 'react';
import classNames from 'classnames';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { sum } from 'lodash';
import { MdArrowDropDown } from 'react-icons/md';
import { MenuItem, Badge, MenuList, Popover } from '@material-ui/core';

import { useStore } from 'store';
import { assetsBasePath } from 'utils/env';
import getSortedGroups from 'store/selectors/getSortedGroups';
import TimelineIcon from 'assets/template/template_icon_timeline.svg?react';
import PostIcon from 'assets/template/template_icon_post.svg?react';
import NotebookIcon from 'assets/template/template_icon_notebook.svg?react';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';

interface Props {
  className?: string
}
const filterOptions = new Map<'all' | GROUP_TEMPLATE_TYPE, string>([
  ['all', '全部'],
  [GROUP_TEMPLATE_TYPE.TIMELINE, '群组/时间线'],
  [GROUP_TEMPLATE_TYPE.POST, '论坛'],
  [GROUP_TEMPLATE_TYPE.NOTE, '笔记/日记'],
]);

export default observer((props: Props) => {
  const {
    activeGroupStore,
    groupStore,
    latestStatusStore,
    sidebarStore,
    modalStore,
  } = useStore();
  const sortedGroups = getSortedGroups(groupStore.groups, latestStatusStore.map);
  const state = useLocalObservable(() => ({
    menu: false,
    filterMenu: false,

    groupTypeFilter: 'all' as 'all' | GROUP_TEMPLATE_TYPE,
  }));
  const menuButton = React.useRef<HTMLDivElement>(null);
  const filterButton = React.useRef<HTMLDivElement>(null);

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
              {state.groupTypeFilter === 'all' && '按模板类型选择'}
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
          <img src={`${assetsBasePath}/button_add_menu.svg`} alt="" width="30" height="30" />
        </div>
      </div>

      {/* <Tooltip
        placement="bottom"
        title="节点状态异常，可能是中断了，可以关闭客户端，重启试一试"
        arrow
        disableHoverListener={!nodeStore.disconnected}
      >
        <div
          className="py-1 px-1 cursor-pointer text-gray-33 relative"
          onClick={() => openMyNodeInfoModal()}
        >
          <BiUser className="text-20 opacity-[0.72]" />
          {nodeStore.disconnected && (
            <RiErrorWarningFill className="text-18 text-red-400 absolute -top-1 -right-2" />
          )}
        </div>
      </Tooltip> */}

      <div className="flex-1 overflow-y-auto">
        {sortedGroups.filter((v) => {
          if (state.groupTypeFilter === 'all') {
            return true;
          }
          return v.app_key === state.groupTypeFilter;
        }).map((group) => {
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
                <div className="h-full flex items-center ml-4">
                  <Badge
                    className="mr-1"
                    classes={{ badge: 'bg-red-500 -mr-1' }}
                    invisible={!sum(Object.values(latestStatus.notificationUnreadCountMap || {}))}
                    variant="dot"
                  >
                    <div
                      className={classNames(
                        'flex items-center justify-center rounded-[10px] h-5 px-[6px]',
                        'text-11 min-w-[20px]',
                        !unreadCount && 'opacity-0',
                        isCurrent && 'bg-white text-black',
                        !isCurrent && 'bg-black text-white',
                      )}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </div>
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
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
              modalStore.joinGroup.open();
            }}
          >
            <img
              className="text-20 mr-4"
              src={`${assetsBasePath}/icon_addseed.svg`}
              alt=""
            />
            <span className="text-18">加入群组</span>
          </MenuItem>
          <MenuItem
            className="py-3 px-6 hover:bg-gray-4a"
            onClick={() => {
              handleMenuClose();
              modalStore.createGroup.open();
            }}
          >
            <img
              className="text-20 mr-4"
              src={`${assetsBasePath}/icon_addanything.svg`}
              alt=""
            />
            <span className="text-18">创建群组</span>
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
