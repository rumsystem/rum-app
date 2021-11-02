import React from 'react';
import { Dialog, DialogProps } from '@material-ui/core';
import { IoMdClose } from 'react-icons/io';

interface IProps extends DialogProps {
  hideCloseButton?: boolean;
}

export default (props: IProps) => {
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      transitionDuration={props.transitionDuration}
      disableEscapeKeyDown
      disableBackdropClick={props.disableBackdropClick !== false}
    >
      <div className="relative">
        {!props.hideCloseButton && (
          <div
            className="text-gray-1e text-22 p-4 top-0 right-0 absolute cursor-pointer"
            onClick={props.onClose as any}
          >
            <IoMdClose />
          </div>
        )}
        {props.children}
      </div>
    </Dialog>
  );
};
