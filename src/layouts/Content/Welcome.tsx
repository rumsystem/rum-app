import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Button from 'components/Button';
import GroupEditorModal from 'components/GroupEditorModal';
import JoinGroupModal from 'components/JoinGroupModal';

export default observer(() => {
  const state = useLocalObservable(() => ({
    showGroupEditorModal: false,
    showJoinGroupModal: false,
  }));

  return (
    <div>
      <div className="pb-3 text-center">欢迎使用 Rum</div>
      <div className="pb-6 text-center">你可以试试</div>
      <div className="flex items-center">
        <Button
          onClick={() => {
            state.showGroupEditorModal = true;
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
      <GroupEditorModal
        open={state.showGroupEditorModal}
        onClose={() => {
          state.showGroupEditorModal = false;
        }}
      />
      <JoinGroupModal
        open={state.showJoinGroupModal}
        onClose={() => {
          state.showJoinGroupModal = false;
        }}
      />
    </div>
  );
});
