import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { BiChevronRight } from 'react-icons/bi';
import { StoreProvider, useStore } from 'store';
import setExternalNodeSetting from './setExternalNodeSetting';
import sleep from 'utils/sleep';
import setStoragePath from './setStoragePath';
import { runInAction } from 'mobx';

type SelectedMode = 'internal' | 'external';

export default async () => new Promise<SelectedMode>((rs) => {
  const div = document.createElement('div');
  document.body.append(div);
  const unmount = () => {
    unmountComponentAtNode(div);
  };
  render(
    (
      <StoreProvider>
        <ModeSelectModal
          rs={(v) => {
            rs(v);
            setTimeout(unmount, 3000);
          }}
        />
      </StoreProvider>
    ),
    div,
  );
});

const ModeSelectModal = observer((props: { rs: (v: SelectedMode) => unknown }) => {
  const state = useLocalObservable(() => ({
    open: true,
  }));
  const { snackbarStore, nodeStore } = useStore();

  const handleSelect = async (mode: SelectedMode) => {
    if (mode === 'internal') {
      runInAction(() => {
        state.open = false;
      });
      snackbarStore.show({
        message: '已选择内置节点',
      });
      await sleep(1000);
      nodeStore.setMode('INTERNAL');
      window.location.reload();
      props.rs(mode);
    }

    if (mode === 'external') {
      const status = await setExternalNodeSetting();
      if (status === 'closed') {
        return;
      }
      await setStoragePath({ canClose: false });
      runInAction(() => {
        state.open = false;
      });
      snackbarStore.show({
        message: '设置成功',
      });
      await sleep(1000);
      window.location.reload();
    }
  };

  return (
    <Dialog
      disableEscapeKeyDown={true}
      hideCloseButton
      open={state.open}
      // onClose={(_, r) => {
      //   if (['backdropClick', 'escapeKeyDown'].includes(r)) {
      //     return;
      //   }
      //   handleClose();
      // }}
      transitionDuration={{
        enter: 300,
      }}
    >
      <div className="p-8 relative">
        <div className="w-60">
          <div
            className="border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-md cursor-pointer"
            onClick={() => handleSelect('internal')}
          >
            <div>
              <div className="text-gray-33">内置节点</div>
              <div className="text-gray-af text-12">使用客户端内置的节点</div>
            </div>
            <BiChevronRight className="text-gray-bd text-20" />
          </div>
          <div
            className="mt-4 border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-md cursor-pointer"
            onClick={() => handleSelect('external')}
          >
            <div>
              <div className="text-gray-33">开发节点</div>
              <div className="text-gray-af text-12">连接本地开发的节点</div>
            </div>
            <BiChevronRight className="text-gray-bd text-20" />
          </div>
        </div>
      </div>
    </Dialog>
  );
});
