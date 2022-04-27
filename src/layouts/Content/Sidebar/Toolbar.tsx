import React from 'react';
import classNames from 'classnames';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { MdArrowDropDown, MdClose } from 'react-icons/md';
import { MenuItem, MenuList, Popover, Input } from '@material-ui/core';

import { useStore } from 'store';
import { lang } from 'utils/lang';
import { GROUP_TEMPLATE_TYPE } from 'apis/group';
import { joinGroup } from 'standaloneModals/joinGroup';
import { createGroup } from 'standaloneModals/createGroup';

import IconSearchAllSeed from 'assets/icon_search_all_seed.svg';
import IconAddSeed from 'assets/icon_add_seed.svg';
import IconAddseed from 'assets/icon_addseed.svg';
import IconAddanything from 'assets/icon_addanything.svg';

interface Props {
  groupTypeFilter: 'all' | GROUP_TEMPLATE_TYPE
  setGroupTypeFilter: (value: 'all' | GROUP_TEMPLATE_TYPE) => void
  searchText: string
  setSearchText: (value: string) => void
  className?: string
}

export default observer((props: Props) => {
  const {
    sidebarStore,
  } = useStore();
  const state = useLocalObservable(() => ({
    menu: false,
    filterMenu: false,
    searchMode: false,
  }));
  const menuButton = React.useRef<HTMLDivElement>(null);
  const filterButton = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

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
  const handleCloseSearchMode = action(() => {
    state.searchMode = false;
    props.setSearchText('');
  });

  const filterOptions = new Map<'all' | GROUP_TEMPLATE_TYPE, string>([
    ['all', lang.all],
    [GROUP_TEMPLATE_TYPE.TIMELINE, lang.sns],
    [GROUP_TEMPLATE_TYPE.POST, lang.forum],
    [GROUP_TEMPLATE_TYPE.NOTE, lang.notebook],
  ]);

  return (<>
    <div className="relative">
      <div
        className={classNames(
          sidebarStore.collapsed && 'hidden',
          'sidebar w-[280px] relative flex flex-col h-full z-20 bg-white',
        )}
      >
        <div className="flex items-center justify-between h-[70px]">
          {!state.searchMode && (<>
            <div className="flex items-center text-16 ml-4">
              <div
                className="cursor-pointer flex items-center border-b pb-px"
                onClick={handleFilterMenuClick}
                ref={filterButton}
              >
                <span className="text-gray-6f mr-1">
                  {props.groupTypeFilter === 'all' && lang.allSeedNets}
                  {props.groupTypeFilter !== 'all' && filterOptions.get(props.groupTypeFilter)}
                </span>
                <MdArrowDropDown className="text-24" />
              </div>
            </div>

            <div className="flex items-center text-gray-1e mr-2">
              <div
                className="mr-4 cursor-pointer"
                onClick={handleOpenSearchMode}
              >
                <img src={IconSearchAllSeed} alt="" width="22" height="22" />
              </div>

              <div
                className="mr-2 cursor-pointer"
                onClick={handleMenuClick}
                ref={menuButton}
                data-test-id="sidebar-plus-button"
              >
                <img src={IconAddSeed} alt="" width="26" height="26" />
              </div>
            </div>
          </>)}

          {state.searchMode && (<>
            <img className="ml-3" src={IconSearchAllSeed} alt="" width="22" height="22" />
            <Input
              inputRef={inputRef}
              className="mt-0 flex-1 ml-3 mr-1 px-px"
              value={props.searchText}
              onChange={action((e) => {
                props.setSearchText(e.target.value);
              })}
            />
            <div className="p-2 cursor-pointer mr-1" onClick={handleCloseSearchMode}>
              <MdClose className="text-16" />
            </div>
          </>)}
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
            src={IconAddseed}
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
          data-test-id="sidebar-menu-item-create-group"
        >
          <img
            className="text-14 mr-4"
            src={IconAddanything}
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
              props.setGroupTypeFilter(k);
              handleFilterMenuClose();
            })}
          >
            <span className="text-16">{v}</span>
          </MenuItem>
        ))}
      </MenuList>
    </Popover>
  </>);
});
