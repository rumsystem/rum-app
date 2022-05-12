import React from 'react';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { TextField } from '@material-ui/core';
import Button from 'components/Button';
import { useStore } from 'store';
import * as Quorum from 'utils/quorum';

export interface SetExternalNodeResponse {
  host: string
  port: number
  jwt: string
  cert: string
}

interface Props {
  onConfirm: (r: SetExternalNodeResponse) => unknown
}

export const SetExternalNode = observer((props: Props) => {
  const { nodeStore, snackbarStore } = useStore();

  const state = useLocalObservable(() => ({
    open: true,
    apiHost: nodeStore.storeApiHost || '',
    port: nodeStore.port ? String(nodeStore.port) : '',
    jwt: nodeStore.jwt || '',
    cert: nodeStore.cert || '',
  }));

  const fileInput = React.useRef<HTMLInputElement>(null);

  const handleSubmit = action(() => {
    if (nodeStore.status.up) {
      Quorum.down();
    }
    props.onConfirm({
      host: state.apiHost || '127.0.0.1',
      port: Number(state.port),
      jwt: state.jwt,
      cert: state.cert,
    });
    state.open = false;
  });

  const handleSelectCert = () => {
    if (fileInput.current) {
      fileInput.current.value = '';
      fileInput.current.click();
    }
  };

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
        message: '读取文件失败！',
        type: 'error',
      });
    });
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
      handleSubmit();
    }
  };

  return (
    <div className="bg-white rounded-12 text-center py-8 px-12">
      <div className="w-60">
        <div className="text-18 font-bold text-gray-700">指定开发节点</div>
        <div className="pt-5">
          <TextField
            className="w-full"
            placeholder="端口"
            size="small"
            value={state.port}
            autoFocus
            onChange={action((e) => { state.port = e.target.value.trim(); })}
            onKeyDown={handleInputKeyDown}
            margin="dense"
            variant="outlined"
          />
        </div>
        <div className="pt-2">
          <TextField
            className="w-full"
            placeholder="127.0.0.1（可选）"
            size="small"
            value={state.apiHost}
            onChange={action((e) => { state.apiHost = e.target.value.trim(); })}
            onKeyDown={handleInputKeyDown}
            margin="dense"
            variant="outlined"
          />
        </div>
        <div className="pt-2">
          <TextField
            className="w-full"
            placeholder="jwt"
            size="small"
            value={state.jwt}
            onChange={action((e) => { state.jwt = e.target.value.trim(); })}
            onKeyDown={handleInputKeyDown}
            margin="dense"
            variant="outlined"
          />
        </div>
        <div className="pt-2">
          <TextField
            className="w-full"
            placeholder="tls证书"
            size="small"
            value={state.cert}
            multiline
            minRows={3}
            maxRows={3}
            onChange={action((e) => { state.cert = e.target.value.trim(); })}
            onKeyDown={handleInputKeyDown}
            margin="dense"
            variant="outlined"
          />
        </div>
        <div className="mt-6" onClick={handleSelectCert}>
          <Button outline fullWidth>
            <div className="my-px py-px">
              从文件选择证书
            </div>
          </Button>
        </div>
        <div className="mt-6" onClick={handleSubmit}>
          <Button fullWidth>确定</Button>
        </div>
      </div>

      <input type="file" hidden ref={fileInput} onChange={handleFileChange} />
    </div>
  );
});
