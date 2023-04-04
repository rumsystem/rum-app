import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Button from 'components/Button';
import JoinGroupModal from 'components/JoinGroupModal';
import { useStore } from 'store';

export default observer(() => {
  const state = useLocalObservable(() => ({
    showJoinGroupModal: false,
  }));
  const { modalStore } = useStore();

  return (
    <div>
      <div className="pb-3 text-center">欢迎使用 Rum</div>
      <div className="pb-6 text-center">你可以试试</div>
      <div className="flex items-center">
        <Button
          onClick={() => {
            modalStore.createGroup.open();
          }}
        >
          创建群组
        </Button>
        <div className="w-6" />
        <Button
          onClick={() => {
            state.showJoinGroupModal = true;
          }}
          outline
        >
          加入群组
        </Button>
      </div>
      <JoinGroupModal
        open={state.showJoinGroupModal}
        onClose={() => {
          state.showJoinGroupModal = false;
        }}
      />
    </div>
  );
});
