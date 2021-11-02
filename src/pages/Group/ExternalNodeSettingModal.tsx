import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { useStore } from 'store';
import { TextField } from '@material-ui/core';
import { sleep } from 'utils';
import * as Quorum from 'utils/quorum';

interface IProps {
  open: boolean;
  onClose: () => void;
}

const ExternalNodeSettingModal = observer(() => {
  const { nodeStore, snackbarStore } = useStore();

  const state = useLocalObservable(() => ({
    apiHost: nodeStore.storeApiHost || '',
    port: nodeStore.port ? String(nodeStore.port) : '',
    jwt: nodeStore.jwt || '',
    cert: nodeStore.cert || '',
  }));

  const fileInput = React.useRef<HTMLInputElement>(null);

  const changeExternalNode = async () => {
    snackbarStore.show({
      message: '设置成功',
    });
    if (nodeStore.status.up) {
      Quorum.down();
    }
    await sleep(1500);
    nodeStore.setMode('EXTERNAL');
    nodeStore.setJWT(state.jwt);
    nodeStore.setPort(Number(state.port));
    nodeStore.setCert(state.cert);
    if (state.apiHost && state.apiHost !== nodeStore.apiHost) {
      nodeStore.setApiHost(state.apiHost);
    }
    window.location.reload();
  };

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
    })
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
            onChange={(e) => {
              state.port = e.target.value.trim();
            }}
            onKeyDown={(e: any) => {
              if (e.keyCode === 13) {
                e.preventDefault();
                e.target.blur();
                changeExternalNode();
              }
            }}
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
            onChange={(e) => {
              state.apiHost = e.target.value.trim();
            }}
            onKeyDown={(e: any) => {
              if (e.keyCode === 13) {
                e.preventDefault();
                e.target.blur();
                changeExternalNode();
              }
            }}
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
            onChange={(e) => {
              state.jwt = e.target.value.trim();
            }}
            onKeyDown={(e: any) => {
              if (e.keyCode === 13) {
                e.preventDefault();
                e.target.blur();
                changeExternalNode();
              }
            }}
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
            rows={3}
            rowsMax={3}
            onChange={(e) => {
              state.cert = e.target.value.trim();
            }}
            onKeyDown={(e: any) => {
              if (e.keyCode === 13) {
                e.preventDefault();
                e.target.blur();
                changeExternalNode();
              }
            }}
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
        <div className="mt-6" onClick={changeExternalNode}>
          <Button fullWidth>确定</Button>
        </div>
      </div>

      <input type="file" hidden ref={fileInput} onChange={handleFileChange} />
    </div>
  );
});

export default observer((props: IProps) => {
  return (
    <Dialog
      disableBackdropClick={false}
      open={props.open}
      onClose={() => props.onClose()}
      transitionDuration={{
        enter: 300,
      }}
    >
      <ExternalNodeSettingModal />
    </Dialog>
  );
});
