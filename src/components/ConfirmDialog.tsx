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
      <div className="w-100">
        <DialogTitle>
          <span className="block pt-6 px-1" />
        </DialogTitle>
        <DialogContent>
          <span className="block px-4 text-center">
            <DialogContentText>
              <span
                style={{
                  maxWidth,
                }}
                className={`block text-gray-4a leading-7 ${contentClassName}`}
              >
                <span
                  className="block"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </span>
            </DialogContentText>
          </span>
        </DialogContent>
        {checkText && (
          <span
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
          </span>
        )}
        <DialogActions>
          <span className="flex pt-3 pb-2 px-6 items-center justify-between w-full">
            {isDangerous && (
              <Button
                className="rounded w-[160px] h-10 whitespace-nowrap"
                onClick={() => {
                  if (loading) {
                    return;
                  }
                  ok(state.checked);
                }}
                isDoing={loading}
                color="orange"
                data-test-id={confirmTestId}
                size="x-large"
              >
                {okText}
              </Button>
            )}
            {!cancelDisabled && (
              <Button
                className="rounded w-[160px] h-10 whitespace-nowrap"
                onClick={() => {
                  if (cancel) {
                    cancel();
                  } else {
                    confirmDialogStore.hide();
                  }
                }}
                outline
                data-test-id={cancelTestId}
                size="x-large"
              >
                {cancelText}
              </Button>
            )}
            {!isDangerous && (
              <Button
                className="rounded w-[160px] h-10 whitespace-nowrap"
                onClick={() => {
                  if (loading) {
                    return;
                  }
                  ok(state.checked);
                }}
                isDoing={loading}
                data-test-id={confirmTestId}
                size="x-large"
              >
                {okText}
              </Button>
            )}
          </span>
        </DialogActions>
        <span className="block pb-2" />
      </div>
    </Dialog>
  );
});
