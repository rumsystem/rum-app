import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { TextField } from '@material-ui/core';
import { action } from 'mobx';
import { lang } from 'utils/lang';
import { useStore } from 'store';

interface IProps {
  title: string
  open: boolean
  submit: (publisher?: string) => Promise<any>
}

export default observer((props: IProps) => {
  const { snackbarStore } = useStore();

  const state = useLocalObservable(() => ({
    loading: false,
    publisher: '',
  }));

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (state.loading) {
      return;
    }
    if (!state.publisher) {
      snackbarStore.show({
        message: lang.inputUserID,
        type: 'error',
      });
      return;
    }
    if (state.publisher.length !== 52) {
      snackbarStore.show({
        message: lang.invalidInput(lang.publisher),
        type: 'error',
      });
      return;
    }
    state.loading = true;
    await props.submit(state.publisher);
    state.loading = false;
  };

  return (
    <Dialog
      open={props.open}
      onClose={() => {
        props.submit();
      }}
      transitionDuration={{
        enter: 300,
      }}
    >
      <div className="bg-white text-center py-8 px-12">
        <div className="w-60">
          <div className="text-18 font-bold text-gray-700">{props.title}</div>
          <div className="pt-5">
            <TextField
              autoFocus
              className="w-full"
              placeholder={lang.inputUserID}
              size="small"
              value={state.publisher}
              onChange={action((e) => { state.publisher = e.target.value; })}
              onKeyDown={handleInputKeyDown}
              margin="dense"
              variant="outlined"
            />
          </div>
          <div className="mt-6" onClick={handleSubmit}>
            <Button fullWidth isDoing={state.loading}>{lang.yes}</Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
});
