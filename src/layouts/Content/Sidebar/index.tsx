import React from 'react';
import classNames from 'classnames';
import { observer, useLocalObservable } from 'mobx-react-lite';
import escapeStringRegexp from 'escape-string-regexp';
import { useStore } from 'store';
import { lang } from 'utils/lang';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';
import GroupItems from './GroupItems';
import Toolbar from './Toolbar';
import ListTypeSwitcher, { ListType } from './ListTypeSwitcher';

import IconFold from 'assets/fold.svg';

interface Props {
  className?: string
}

const LIST_TYPE_STORAGE_KEY = 'SIDEBAR_LIST_TYPE';

export default observer((props: Props) => {
  const {
    groupStore,
    latestStatusStore,
    sidebarStore,
  } = useStore();
  const state = useLocalObservable(() => ({
    groupTypeFilter: 'all' as 'all' | GROUP_TEMPLATE_TYPE,
    searchText: '',
    listType: (localStorage.getItem(LIST_TYPE_STORAGE_KEY) || 'text') as ListType,

    get groups() {
      const filteredGroups = groupStore.groups.filter((v) => {
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
          src={IconFold}
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
          setGroupTypeFilter={(value) => {
            state.groupTypeFilter = value;
          }}
          searchText={state.searchText}
          setSearchText={(value) => {
            state.searchText = value;
          }}
        />
        <ListTypeSwitcher
          listType={state.listType}
          setListType={(listType) => {
            state.listType = listType;
            localStorage.setItem(LIST_TYPE_STORAGE_KEY, listType);
          }}
        />
        <div className="flex-1 overflow-y-auto">
          <GroupItems
            groups={state.groups}
            highlight={state.searchText ? state.searchText : ''}
            listType={state.listType}
          />
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
