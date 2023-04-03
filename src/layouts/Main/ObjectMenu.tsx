import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { Menu, MenuItem } from '@mui/material';
import { RiMoreFill } from 'react-icons/ri';
import { HiOutlineShare } from 'react-icons/hi';
import { MdInfoOutline, MdClose } from 'react-icons/md';
import useActiveGroup from 'store/selectors/useActiveGroup';
import TrxModal from 'components/TrxModal';
import { lang } from 'utils/lang';
import { shareGroup } from 'standaloneModals/shareGroup';
import { IDBPost } from 'hooks/useDatabase/models/posts';

interface IProps {
  object: IDBPost
  onClickUpdateMenu: () => void
  onClickDeleteMenu: () => void
}

export default observer((props: IProps) => {
  const { object } = props;
  const activeGroup = useActiveGroup();
  const state = useLocalObservable(() => ({
    anchorEl: null as null | HTMLElement,
    showTrxModal: false,
  }));

  const handleMenuClick = (event: React.MouseEvent<HTMLDivElement>) => {
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
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'bottom',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          style: {
            margin: '10px 0 0 0',
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
        <MenuItem onClick={() => shareGroup(activeGroup.group_id, object.id)}>
          <div className="flex items-center text-gray-600 leading-none pl-1 py-2 font-bold pr-5">
            <span className="flex items-center mr-3">
              <HiOutlineShare className="text-18 opacity-50" />
            </span>
            {lang.share}
          </div>
        </MenuItem>
        {activeGroup.user_pubkey === object.publisher && (
          <div>
            {/* <MenuItem onClick={() => {
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
            </MenuItem> */}
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
        trxId={object.trxId}
        open={state.showTrxModal}
        onClose={closeTrxModal}
      />
    </div>
  );
});
