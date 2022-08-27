import React from 'react';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { MdDelete } from 'react-icons/md';
import { IconButton, Input } from '@material-ui/core';
import Button from 'components/Button';
import { lang } from 'utils/lang';
import { getWasmBootstraps, saveWasmBootstraps } from 'utils/wasmBootstrap';

interface Props {
  onConfirm: (bootstraps: Array<string>) => unknown
}

export const WASMBootstrap = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    bootstraps: getWasmBootstraps(),
    loading: false,
  }));

  const handleSubmit = action(() => {
    if (state.loading) {
      return;
    }
    if (state.bootstraps.some((v) => !v.trim())) {
      return;
    }
    state.loading = true;
    saveWasmBootstraps(state.bootstraps);
    props.onConfirm(state.bootstraps);
  });

  const handleRestoreDefault = action(() => {
    state.bootstraps = getWasmBootstraps();
  });

  return (
    <div className="bg-white rounded-0 text-center py-8 px-12">
      <div className="w-90">
        <div className="text-18 font-bold text-gray-700">bootstraps</div>
        {state.bootstraps.map((v, i) => (
          <div className="flex items-center pt-5" key={i}>
            <Input
              className="w-full"
              multiline
              placeholder={lang.port}
              value={v}
              autoFocus
              onChange={action((e) => { state.bootstraps[i] = e.target.value.trim(); })}
              margin="dense"
            />
            <IconButton
              className="p-1 ml-1"
              disabled={state.bootstraps.length === 1}
              onClick={action(() => state.bootstraps.splice(i, 1))}
            >
              <MdDelete />
            </IconButton>
          </div>
        ))}
        <div className="mt-4">
          <Button className="mr-4" onClick={handleRestoreDefault}>
            {lang.restoreDefault}
          </Button>
          <Button onClick={action(() => state.bootstraps.push(''))}>
            {lang.add}
          </Button>
        </div>
        <div className="mt-6" onClick={handleSubmit}>
          <Button fullWidth isDoing={state.loading}>{lang.yes}</Button>
        </div>
      </div>
    </div>
  );
});
