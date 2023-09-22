import React from 'react';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { TextField } from '@material-ui/core';
import Button from 'components/Button';
import { useStore } from 'store';
import * as Quorum from 'utils/quorum';
import { lang } from 'utils/lang';
import { IApiConfig } from 'store/apiConfigHistory';

interface Props {
  onConfirm: (r: IApiConfig) => unknown
}

export const SetExternalNode = observer((props: Props) => {
  const { nodeStore } = useStore();

  const state = useLocalObservable(() => ({
    origin: nodeStore.apiConfig.origin || '',
    jwt: nodeStore.apiConfig.jwt || '',
  }));

  const handleSubmit = action(() => {
    if (nodeStore.status.up) {
      Quorum.down();
    }
    props.onConfirm({
      origin: state.origin,
      jwt: state.jwt,
    });
  });

  return (
    <div className="bg-white rounded-0 text-center py-8 px-12">
      <div className="w-60">
        <div className="text-18 font-bold text-gray-700">{lang.setExternalNode}</div>
        <div className="pt-2">
          <TextField
            className="w-full"
            placeholder="http://127.0.0.1:8002"
            size="small"
            value={state.origin}
            onChange={action((e) => { state.origin = e.target.value.trim(); })}
            margin="dense"
            variant="outlined"
          />
        </div>
        <div className="pt-2">
          <TextField
            className="w-full"
            placeholder={`jwt（${lang.optional}）`}
            size="small"
            value={state.jwt}
            onChange={action((e) => { state.jwt = e.target.value.trim(); })}
            margin="dense"
            variant="outlined"
          />
        </div>
        <div className="mt-6" onClick={handleSubmit}>
          <Button fullWidth>{lang.yes}</Button>
        </div>
      </div>
    </div>
  );
});
