import React from 'react';
import { Dialog, DialogProps } from '@material-ui/core';
import { IoMdClose } from 'react-icons/io';

interface IProps extends DialogProps {
  hideCloseButton?: boolean
}

export default (props: IProps) => {
  const { hideCloseButton, ...dialogProps } = props;
  return (
    <Dialog {...dialogProps}>
      <div className="relative">
        {!hideCloseButton && (
          <div
            className="text-gray-6d text-22 p-4 top-0 right-0 absolute cursor-pointer z-10"
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
