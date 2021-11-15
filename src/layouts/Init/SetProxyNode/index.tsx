import React from 'react';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { TextField } from '@material-ui/core';
import Button from 'components/Button';
import { useStore } from 'store';
import * as Quorum from 'utils/quorum';
import { lang } from 'utils/lang';
import { IApiConfig } from 'store/node';

interface Props {
  onConfirm: (r: IApiConfig) => unknown
}

export const SetProxyNode = observer((props: Props) => {
  const { nodeStore, snackbarStore } = useStore();

  const state = useLocalObservable(() => ({
    open: true,
    host: nodeStore.apiConfig.host || '',
    port: nodeStore.apiConfig.port || '',
    jwt: nodeStore.apiConfig.jwt || '',
    cert: nodeStore.apiConfig.cert || '',
  }));

  const fileInput = React.useRef<HTMLInputElement>(null);

  const handleSubmit = action(() => {
    if (!state.port) {
      snackbarStore.show({
        message: lang.require(lang.port),
        type: 'error',
      });
      return;
    }
    if (!state.cert) {
      snackbarStore.show({
        message: lang.require(lang.tslCert),
        type: 'error',
      });
      return;
    }
    if (nodeStore.status.up) {
      Quorum.down();
    }
    props.onConfirm({
      host: state.host || '127.0.0.1',
      port: state.port,
      jwt: state.jwt,
      cert: state.cert,
    });
    state.open = false;
  });

  const handleFileChange = () => {
    if (!fileInput.current) {
      return;
    }
    const file = fileInput.current.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 8192) {
      return;
    }

    const reader = new FileReader();

    reader.readAsText(file);
    reader.addEventListener('load', () => {
      state.cert = reader.result as string;
    });
    reader.addEventListener('error', (e) => {
      console.error(e);
      snackbarStore.show({
        message: lang.failToOpenFile,
        type: 'error',
      });
    });
  };

  return (
    <div className="bg-white rounded-0 text-center py-8 px-12">
      <div className="w-60">
        <div className="text-18 font-bold text-gray-700">{lang.proxyToProxyNode}</div>
        <div className="pt-5">
          <TextField
            className="w-full"
            placeholder={lang.port}
            size="small"
            value={state.port}
            autoFocus
            onChange={action((e) => { state.port = e.target.value.trim(); })}
            margin="dense"
            variant="outlined"
          />
        </div>
        <div className="pt-2">
          <TextField
            className="w-full"
            placeholder={`127.0.0.1（${lang.optional}）`}
            size="small"
            value={state.host}
            onChange={action((e) => { state.host = e.target.value.trim(); })}
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
        <div className="pt-2">
          <TextField
            className="w-full"
            placeholder={lang.tslCert}
            size="small"
            value={state.cert}
            multiline
            minRows={3}
            maxRows={3}
            onChange={action((e) => { state.cert = e.target.value.trim(); })}
            margin="dense"
            variant="outlined"
          />
        </div>
        <div className="mt-6" onClick={handleSubmit}>
          <Button fullWidth>{lang.yes}</Button>
        </div>
      </div>

      <input type="file" hidden ref={fileInput} onChange={handleFileChange} />
    </div>
  );
});
