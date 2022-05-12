import React from 'react';
import classNames from 'classnames';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { sum } from 'lodash';
import { MdArrowDropDown } from 'react-icons/md';
import { Menu, MenuItem, Badge } from '@material-ui/core';

import GroupEditorModal from 'components/GroupEditorModal';
import JoinGroupModal from 'components/JoinGroupModal';
import { useStore } from 'store';
import { assetsBasePath } from 'utils/env';
import getSortedGroups from 'store/selectors/getSortedGroups';
import TimelineIcon from 'assets/template/template_icon_timeline.svg?react';

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
  const sortedGroups = getSortedGroups(groupStore.groups, latestStatusStore.map);
  const state = useLocalObservable(() => ({
    menu: false,
    filterMenu: false,
    showGroupEditorModal: false,
    showJoinGroupModal: false,
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

  const openGroupEditorModal = () => {
    handleMenuClose();
    state.showGroupEditorModal = true;
  };

  const openJoinGroupModal = () => {
    handleMenuClose();
    state.showJoinGroupModal = true;
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
              按模板类型选择
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
        {sortedGroups.map((group) => {
          const latestStatus = latestStatusStore.map[group.GroupId] || latestStatusStore.DEFAULT_LATEST_STATUS;
          const isCurrent = activeGroupStore.id === group.GroupId;
          const unreadCount = latestStatus.unreadCount;
          return (
            <div key={group.GroupId}>
              <div
                className={classNames(
                  'flex justify-between items-center leading-none h-[50px] px-3',
                  'text-14 cursor-pointer tracking-wider relative',
                  isCurrent && 'bg-black text-white',
                  !isCurrent && 'bg-white text-black',
                )}
                onClick={() => openGroup(group.GroupId)}
              >
                <div className="flex items-center truncate">
                  <TimelineIcon
                    className={classNames(
                      'mr-1 mt-[2px] flex-none',
                      isCurrent && 'text-white',
                      !isCurrent && 'text-gray-88',
                    )}
                    width="24"
                  />
                  <div className="py-1 font-medium truncate text-14">
                    {group.GroupName}
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

      <GroupEditorModal
        open={state.showGroupEditorModal}
        onClose={() => {
          state.showGroupEditorModal = false;
        }}
      />

      <JoinGroupModal
        open={state.showJoinGroupModal}
        onClose={() => {
          state.showJoinGroupModal = false;
        }}
      />

      <Menu
        className="ml-12 mt-6"
        anchorEl={menuButton.current}
        open={state.menu}
        onClose={handleMenuClose}
        autoFocus={false}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          square: true,
          className: 'bg-gray-33 text-white font-medium',
        }}
      >
        <MenuItem
          className="py-3 px-6 hover:bg-gray-4a"
          onClick={() => openJoinGroupModal()}
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
          onClick={() => openGroupEditorModal()}
        >
          <img
            className="text-20 mr-4"
            src={`${assetsBasePath}/icon_addanything.svg`}
            alt=""
          />
          <span className="text-18">创建群组</span>
        </MenuItem>
      </Menu>

      <Menu
        className="ml-4 mt-2"
        anchorEl={filterButton.current}
        open={state.filterMenu}
        onClose={handleFilterMenuClose}
        autoFocus={false}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          square: true,
          className: 'min-w-[140px]',
          style: {
            borderRadius: '4px',
          },
        }}
      >
        {['全部', '群组/时间线', '论坛', '笔记/日记'].map((v) => (
          <MenuItem
            className="py-1"
            key={v}
            onClick={handleFilterMenuClose}
          >
            <span className="text-16">{v}</span>
          </MenuItem>
        ))}
      </Menu>

      <style jsx>{`
        .sidebar {
          box-shadow: 3px 0 6px 0 rgba(0, 0, 0, 0.16);
        }
      `}</style>
    </div>
  );
});
