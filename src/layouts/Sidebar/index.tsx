import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { BiUser } from 'react-icons/bi';
import { RiAddLine, RiErrorWarningFill } from 'react-icons/ri';
import { MdPeopleOutline } from 'react-icons/md';
import classNames from 'classnames';
import { Menu, MenuItem, Badge } from '@material-ui/core';
import Tooltip from '@material-ui/core/Tooltip';
import GroupEditorModal from 'components/GroupEditorModal';
import JoinGroupModal from 'components/JoinGroupModal';
import MyNodeInfoModal from './MyNodeInfoModal';
import GroupMenu from 'components/GroupMenu';
import { useStore } from 'store';
import { app } from '@electron/remote';
import { isProduction } from 'utils/env';
import { sum } from 'lodash';
import Fade from '@material-ui/core/Fade';
import getSortedGroups from 'store/selectors/getSortedGroups';

export default observer(() => {
  const { activeGroupStore, nodeStore, groupStore, latestStatusStore } = useStore();
  const sortedGroups = getSortedGroups(groupStore.groups, latestStatusStore.map);
  const state = useLocalObservable(() => ({
    anchorEl: null,
    showMenu: false,
    showGroupEditorModal: false,
    showMyNodeInfoModal: false,
    showJoinGroupModal: false,
  }));

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

  const openMyNodeInfoModal = () => {
    state.showMyNodeInfoModal = true;
  };

  const handleMenuClick = (event: any) => {
    state.anchorEl = event.currentTarget;
  };

  const handleMenuClose = () => {
    state.anchorEl = null;
  };

  return (
    <div className="relative flex flex-col h-screen">
      <div className="pl-4 pr-3 leading-none h-13 flex items-center justify-between text-gray-500 border-b border-gray-200 font-bold">
        <Tooltip
          placement="right"
          title={`版本：${app.getVersion()}`}
          arrow
        >
          <div className="flex items-center">
            <img
              src={`${isProduction
                ? process.resourcesPath
                : `file://${app.getAppPath()}`
              }/assets/logo.png`}
              alt="logo"
              width="24"
            />
            <div className="opacity-90 text-15 ml-2 tracking-widest">Rum</div>
          </div>
        </Tooltip>
        <div className="flex items-center">
          <div
            className="py-1 px-1 mr-2 cursor-pointer text-gray-33"
            onClick={handleMenuClick}
          >
            <RiAddLine className="text-24 opacity-75" />
          </div>
          <Tooltip
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
          </Tooltip>
        </div>
        <Menu
          anchorEl={state.anchorEl}
          open={Boolean(state.anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          PaperProps={{
            style: {
              width: 140,
              margin: '27px 0px 0px 20px',
            },
          }}
        >
          <MenuItem onClick={() => openJoinGroupModal()}>
            <div className="flex items-center text-gray-600 leading-none pl-1 py-2">
              <span className="flex items-center mr-3">
                <MdPeopleOutline className="text-20 opacity-50" />
              </span>
              <span className="font-bold">加入群组</span>
            </div>
          </MenuItem>
          <MenuItem onClick={() => openGroupEditorModal()}>
            <div className="flex items-center text-gray-600 leading-none pl-1 py-2">
              <span className="flex items-center mr-3">
                <RiAddLine className="text-20 opacity-50" />
              </span>
              <span className="font-bold">创建群组</span>
            </div>
          </MenuItem>
        </Menu>
      </div>
      <div className="flex-1 overflow-y-auto">
        {sortedGroups.map((group) => {
          const latestStatus = latestStatusStore.map[group.group_id] || latestStatusStore.DEFAULT_LATEST_STATUS;
          return (
            <div key={group.group_id}>
              <div
                className={classNames(
                  {
                    'bg-black text-white':
                      activeGroupStore.id === group.group_id,
                    'bg-white text-black':
                      activeGroupStore.id !== group.group_id,
                    'text-gray-4a': activeGroupStore.id !== group.group_id,
                  },
                  'leading-none font-bold text-14 py-4 px-4 cursor-pointer tracking-wider flex justify-between items-center item relative',
                )}
                onClick={() => openGroup(group.group_id)}
              >
                <div className="py-1 truncate">{group.group_name} </div>
                {activeGroupStore.id === group.group_id
                  && !latestStatus.unreadCount && (
                  <Fade in={true} timeout={500}>
                    <div
                      onClick={(e: any) => {
                        e.stopPropagation();
                      }}
                      className="menu text-20 text-white -mr-2 z-50"
                    >
                      <GroupMenu />
                    </div>
                  </Fade>
                )}
                <div className="absolute top-0 right-0 h-full flex items-center mr-5">
                  <Badge
                    className="transform scale-90 mr-1"
                    classes={{
                      badge: classNames(
                        activeGroupStore.id === group.group_id
                          && 'bg-white text-black',
                        activeGroupStore.id !== group.group_id
                          && 'bg-black text-white',
                      ),
                    }}
                    badgeContent={latestStatus.unreadCount}
                    invisible={!latestStatus.unreadCount}
                    variant="standard"
                  />
                  <Badge
                    className="transform scale-90 mr-1"
                    classes={{
                      badge: 'bg-red-500',
                    }}
                    invisible={
                      activeGroupStore.id === group.group_id
                      || latestStatus.unreadCount > 0
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
      </div>
      <GroupEditorModal
        open={state.showGroupEditorModal}
        onClose={() => {
          state.showGroupEditorModal = false;
        }}
      />
      <MyNodeInfoModal
        open={state.showMyNodeInfoModal}
        onClose={() => {
          state.showMyNodeInfoModal = false;
        }}
      />
      <JoinGroupModal
        open={state.showJoinGroupModal}
        onClose={() => {
          state.showJoinGroupModal = false;
        }}
      />
      <style jsx>{`
        .item .menu {
          display: none;
        }
        .item:hover .menu {
          display: block;
        }
      `}</style>
    </div>
  );
});
