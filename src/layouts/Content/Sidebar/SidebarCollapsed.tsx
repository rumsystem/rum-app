import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import { assetsBasePath } from 'utils/env';

interface Props {
  className?: string
}

export default observer((props: Props) => {
  const {
    groupStore,
    latestStatusStore,
    sidebarStore,
  } = useStore();

  const unreadCount = groupStore.groups
    .map((group) => {
      const latestStatus = latestStatusStore.map[group.group_id] || latestStatusStore.DEFAULT_LATEST_STATUS;
      return latestStatus.unreadCount;
    })
    .reduce((p, c) => p + c, 0);

  if (!sidebarStore.collapsed) {
    return (
      <div className={classNames(props.className)} />
    );
  }

  return (<>
    <div
      className={classNames(
        'sidebar-collapsed flex items-center bg-white rounded-r-lg pl-2 pr-3',
        'select-none cursor-pointer',
        props.className,
      )}
      onClick={() => sidebarStore.restore()}
    >
      {!!unreadCount && (
        <div
          className={classNames(
            'flex items-center justify-center rounded-[10px] h-5 px-[6px] mr-[2px]',
            'text-11 min-w-[20px] bg-black text-white',
          )}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </div>
      )}
      <img className="ml-1 -mr-1 flex-none" src={`${assetsBasePath}/fold.svg`} alt="" />
    </div>
    <style jsx>{`
      .sidebar-collapsed {
        box-shadow: 0 3px 6px 0 rgba(0, 0, 0, 0.16);
      }
    `}</style>
  </>);
});
