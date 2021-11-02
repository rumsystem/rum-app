import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { BiChevronRight } from 'react-icons/bi';
import { sleep } from 'utils';
import { useStore } from 'store';
import ExternalNodeSettingModal from './ExternalNodeSettingModal';

interface IProps {
  open: boolean
  onClose: () => void
}

const ModeSelector = observer(() => {
  const { nodeStore, snackbarStore } = useStore();
  const state = useLocalObservable(() => ({
    showExternalNodeSettingModal: false,
  }));

  return (
    <div className="p-8 relative">
      <div className="w-60">
        <div
          className="border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-md cursor-pointer"
          onClick={async () => {
            snackbarStore.show({
              message: '已选择内置节点',
            });
            await sleep(1500);
            nodeStore.setMode('INTERNAL');
            window.location.reload();
          }}
        >
          <div>
            <div className="text-gray-33">内置节点</div>
            <div className="text-gray-af text-12">使用客户端内置的节点</div>
          </div>
          <BiChevronRight className="text-gray-bd text-20" />
        </div>
        <div
          className="mt-4 border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-md cursor-pointer"
          onClick={() => {
            state.showExternalNodeSettingModal = true;
          }}
        >
          <div>
            <div className="text-gray-33">开发节点</div>
            <div className="text-gray-af text-12">连接本地开发的节点</div>
          </div>
          <BiChevronRight className="text-gray-bd text-20" />
        </div>
      </div>
      <ExternalNodeSettingModal
        open={state.showExternalNodeSettingModal}
        onClose={() => { state.showExternalNodeSettingModal = false; }}
      />
    </div>
  );
});

export default observer((props: IProps) => (
  <Dialog
    disableEscapeKeyDown={true}
    hideCloseButton
    open={props.open}
    onClose={(_, r) => {
      if (['backdropClick', 'escapeKeyDown'].includes(r)) {
        return;
      }
      props.onClose();
    }}
    transitionDuration={{
      enter: 300,
    }}
  >
    <ModeSelector />
  </Dialog>
));
