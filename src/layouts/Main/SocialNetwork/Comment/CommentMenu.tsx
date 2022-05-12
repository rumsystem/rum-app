import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { Menu, MenuItem } from '@material-ui/core';
import { RiMoreFill } from 'react-icons/ri';
import { MdInfoOutline } from 'react-icons/md';
import TrxModal from 'components/TrxModal';
import { lang } from 'utils/lang';

export default observer((props: { trxId: string }) => {
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
        className="text-gray-af px-2 opacity-80 cursor-pointer mt-[-3px]"
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
      </Menu>
      <TrxModal
        trxId={props.trxId}
        open={state.showTrxModal}
        onClose={closeTrxModal}
      />
    </div>
  );
});
