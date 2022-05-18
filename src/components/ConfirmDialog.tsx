import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import {
  DialogContent,
  DialogContentText,
  DialogActions,
  DialogTitle,
  Checkbox,
} from '@material-ui/core';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { useStore } from 'store';
import { lang } from 'utils/lang';

export default observer(() => {
  const { confirmDialogStore } = useStore();
  const state = useLocalObservable(() => ({
    checked: false,
  }));
  const {
    open,
    ok,
    cancel,
    content,
    cancelText,
    cancelDisabled,
    okText = lang.yes,
    contentClassName,
    loading,
    isDangerous,
    maxWidth,
    confirmTestId,
    cancelTestId,
    checkText,
  } = confirmDialogStore;

  React.useEffect(() => {
    if (!open) {
      state.checked = false;
    }
  }, [open]);

  return (
    <Dialog
      hideCloseButton
      transitionDuration={{
        appear: 500,
        enter: 300,
        exit: 500,
      }}
      open={open}
      onClose={() => {
        if (!cancel) {
          confirmDialogStore.hide();
        }
      }}
      className="flex justify-center items-center"
    >
      <DialogTitle>
        <span className="block pt-6 px-1" />
      </DialogTitle>
      <DialogContent>
        <span className="block px-4 text-center">
          <DialogContentText>
            <div>
              <div
                style={{
                  maxWidth,
                }}
                className={`block text-gray-600 leading-7 ${contentClassName}`}
              >
                <span
                  className="block"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            </div>
          </DialogContentText>
        </span>
      </DialogContent>
      {checkText && (
        <div
          className="flex items-center justify-center -mt-2 cursor-pointer"
          onClick={() => {
            state.checked = !state.checked;
          }}
        >
          <Checkbox
            size="small"
            checked={state.checked}
            color="primary"
          />
          <span className="text-gray-88 text-13 cursor-pointer -ml-2-px">
            {checkText}
          </span>
        </div>
      )}
      <DialogActions>
        <span className="flex pt-3 pb-2 px-6 items-center justify-end w-64">
          {!cancelDisabled && (
            <span
              className="block text-gray-33 mr-6 pr-1 cursor-pointer"
              data-test-id={cancelTestId}
              onClick={() => {
                if (cancel) {
                  cancel();
                } else {
                  confirmDialogStore.hide();
                }
              }}
            >
              {cancelText}
            </span>
          )}
          <Button
            onClick={() => ok(state.checked)}
            isDoing={loading}
            outline={isDangerous}
            color={isDangerous ? 'red' : 'primary'}
            data-test-id={confirmTestId}
          >
            {okText}
          </Button>
        </span>
      </DialogActions>
      <span className="block pb-2" />
    </Dialog>
  );
});
