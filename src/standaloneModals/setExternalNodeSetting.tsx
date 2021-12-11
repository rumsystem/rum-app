import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { StoreProvider, useStore } from 'store';
import { TextField } from '@material-ui/core';
import * as Quorum from 'utils/quorum';
import { action } from 'mobx';

type SetResponse = 'changed' | 'closed';

export default async (props?: { force: boolean }) => new Promise<SetResponse>((rs) => {
  const div = document.createElement('div');
  document.body.append(div);
  const unmount = () => {
    unmountComponentAtNode(div);
    div.remove();
  };
  render(
    (
      <StoreProvider>
        <ExternalNodeSettingModal
          rs={(v) => {
            rs(v);
            setTimeout(unmount, 3000);
          }}
          force={props && props.force}
        />
      </StoreProvider>
    ),
    div,
  );
});

const ExternalNodeSettingModal = observer((props: { rs: (v: SetResponse) => unknown, force?: boolean }) => {
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
    nodeStore.setMode('EXTERNAL');
    nodeStore.setJWT(state.jwt);
    nodeStore.setPort(Number(state.port));
    nodeStore.setCert(state.cert);
    if (state.apiHost && state.apiHost !== nodeStore.apiHost) {
      nodeStore.setApiHost(state.apiHost);
    }
    props.rs('changed');
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

  const handleClose = action(() => {
    props.rs('closed');
    state.open = false;
  });

  return (
    <Dialog
      disableEscapeKeyDown={props.force}
      hideCloseButton={props.force}
      open={state.open}
      onClose={handleClose}
      transitionDuration={{
        enter: 300,
      }}
    >
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
    </Dialog>
  );
});
