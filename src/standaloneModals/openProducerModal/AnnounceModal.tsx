import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { TextField } from '@material-ui/core';
import { action } from 'mobx';
import { lang } from 'utils/lang';

interface IProps {
  open: boolean
  onClose: () => void
}

export default observer((props: IProps) => {
  const state = useLocalObservable(() => ({
    memo: '',
    remember: false,
  }));

  const handleSubmit = () => {
    handleClose();
  };

  const handleClose = action(() => {
    props.onClose();
  });

  return (
    <Dialog
      open={props.open}
      onClose={handleClose}
      transitionDuration={{
        enter: 300,
      }}
    >
      <div className="bg-white text-center py-8 px-12">
        <div className="w-60">
          <div className="text-18 font-bold text-gray-700">申请成为出块节点</div>
          <div className="pt-5">
            <TextField
              className="w-full"
              placeholder="理由（可选）"
              size="small"
              multiline
              minRows={3}
              value={state.memo}
              onChange={action((e) => { state.memo = e.target.value; })}
              margin="dense"
              variant="outlined"
              type="memo"
            />
          </div>
          <div className="mt-6" onClick={handleSubmit}>
            <Button fullWidth>{lang.yes}</Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
});
