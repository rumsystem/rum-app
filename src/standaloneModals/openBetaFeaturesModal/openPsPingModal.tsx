import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { StoreProvider, useStore } from 'store';
import { ThemeRoot } from 'utils/theme';
import Button from 'components/Button';
import { TextField } from '@material-ui/core';
import { lang } from 'utils/lang';
import psPingApi from 'apis/psPing';
import { isEmpty } from 'lodash';

export default () => {
  const div = document.createElement('div');
  document.body.append(div);
  const unmount = () => {
    unmountComponentAtNode(div);
    div.remove();
  };
  render(
    (
      <ThemeRoot>
        <StoreProvider>
          <PsPingModal
            rs={() => {
              setTimeout(unmount, 3000);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
};

const PsPingModal = observer((props: any) => {
  const state = useLocalObservable(() => ({
    open: true,
    peerId: '',
    result: {},
  }));
  const { snackbarStore } = useStore();

  const handleClose = () => {
    state.open = false;
    props.rs();
  };

  const handleSubmit = async () => {
    try {
      const ret = await psPingApi.ping(state.peerId);
      state.result = ret || {};
    } catch (err) {
      console.log(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
  };

  return (
    <Dialog
      open={state.open}
      onClose={() => {
        handleClose();
      }}
      hideCloseButton
      transitionDuration={{
        enter: 300,
      }}
    >
      <div className="bg-white text-center py-8 px-12">
        <div className="w-65">
          <div className="text-18 font-bold text-gray-700">psPing</div>
          <div className="pt-5">
            <TextField
              className="w-full"
              placeholder={lang.input(' peer id')}
              size="small"
              value={state.peerId}
              onChange={(e) => { state.peerId = e.target.value; }}
              margin="dense"
              variant="outlined"
            />
          </div>
          {!isEmpty(state.result) && (
            <div>
              <div className="text-gray-88 py-1 mt-3 text-12">结果：</div>
              <div className="border border-gray-af bg-gray-f2 p-4 text-12 text-gray-700 tracking-wide text-left">
                <pre dangerouslySetInnerHTML={{ __html: JSON.stringify(state.result, null, 2) }} />
              </div>
            </div>
          )}
          <div className="mt-6" onClick={handleSubmit}>
            <Button fullWidth>{lang.yes}</Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
});
