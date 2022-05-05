import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { Menu, MenuItem } from '@material-ui/core';
import { RiMoreFill } from 'react-icons/ri';
import { MdInfoOutline, MdClose, MdOutlineEdit } from 'react-icons/md';
import { INoteItem } from 'apis/content';
import useActiveGroup from 'store/selectors/useActiveGroup';
import TrxModal from 'components/TrxModal';
import { lang } from 'utils/lang';

interface IProps {
  object: INoteItem
  onClickUpdateMenu: () => void
  onClickDeleteMenu: () => void
}

export default observer((props: IProps) => {
  const { object } = props;
  const activeGroup = useActiveGroup();
  const state = useLocalObservable(() => ({
    anchorEl: null,
    showTrxModal: false,
  }));

  const handleMenuClick = (event: any) => {
    state.anchorEl = event.currentTarget;
  };

  const handleMenuClose = () => {
    state.anchorEl = null;
  };

  const openTrxModal = () => {
    handleMenuClose();
    state.showTrxModal = true;
  };

  const closeTrxModal = () => {
    state.showTrxModal = false;
  };

  return (
    <div>
      <div
        className="text-gray-af px-[2px] opacity-80 cursor-pointer"
        onClick={handleMenuClick}
      >
        <RiMoreFill className="text-20" />
      </div>

      <Menu
        anchorEl={state.anchorEl}
        open={Boolean(state.anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          style: {
            margin: '27px 0 0 20px',
          },
        }}
      >
        <MenuItem onClick={() => openTrxModal()}>
          <div className="flex items-center text-gray-600 leading-none pl-1 py-2 font-bold pr-5">
            <span className="flex items-center mr-3">
              <MdInfoOutline className="text-18 opacity-50" />
            </span>
            {lang.info}
          </div>
        </MenuItem>
        {activeGroup.user_pubkey === object.Publisher && (
          <div>
            <MenuItem onClick={() => {
              props.onClickUpdateMenu();
              handleMenuClose();
            }}
            >
              <div className="flex items-center text-gray-600 leading-none pl-1 py-2 font-bold pr-2">
                <span className="flex items-center mr-3">
                  <MdOutlineEdit className="text-18 opacity-50" />
                </span>
                <span>编辑</span>
              </div>
            </MenuItem>
            <MenuItem onClick={() => {
              props.onClickDeleteMenu();
              handleMenuClose();
            }}
            >
              <div className="flex items-center text-red-400 leading-none pl-1 py-2 font-bold pr-2">
                <span className="flex items-center mr-3">
                  <MdClose className="text-18 opacity-50" />
                </span>
                <span>删除</span>
              </div>
            </MenuItem>
          </div>
        )}
      </Menu>
      <TrxModal
        groupId={activeGroup.group_id}
        trxId={object.TrxId}
        open={state.showTrxModal}
        onClose={closeTrxModal}
      />
    </div>
  );
});
