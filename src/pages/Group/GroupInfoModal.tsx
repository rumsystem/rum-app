import React from 'react';
import { observer } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import MiddleTruncate from 'components/MiddleTruncate';
import { useStore } from 'store';
import { ago } from 'utils';
import useActiveGroup from 'store/selectors/useActiveGroup';

interface IProps {
  open: boolean;
  onClose: () => void;
}

const GroupInfo = observer(() => {
  const { groupStore } = useStore();
  const activeGroup = useActiveGroup();
  const statusText = groupStore.getStatusText(activeGroup);

  return (
    <div className="bg-white rounded-12 p-8">
      <div className="pt-2 px-6 pb-5">
        <div className="text-18 font-bold text-gray-700 text-center pb-5">
          群组详情
        </div>
        <div className="p-6 text-gray-88 text-13 border border-gray-d8 rounded-12 shadow">
          <div className="flex items-center">
            <span className="w-20">名称：</span>
            <span className="text-gray-4a opacity-90">
              {activeGroup.GroupName}
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-20">ID：</span>
            <span className="text-gray-4a opacity-90">
              {activeGroup.GroupId}
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-20">创建人：</span>
            <div className="text-gray-4a opacity-90">
              <MiddleTruncate string={activeGroup.OwnerPubKey} length={15} />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-20">最新区块：</span>
            <span className="text-gray-4a opacity-90">
              {activeGroup.LatestBlockId}
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-20">区块数：</span>
            <span className="text-gray-4a opacity-90">
              {activeGroup.LatestBlockNum}
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-20">最近更新：</span>
            <span className="text-gray-4a opacity-90">
              {ago(new Date(activeGroup.LastUpdate / 1000000).toISOString())}
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-20">状态：</span>
            <span className="text-gray-4a opacity-90">{statusText}</span>
          </div>
        </div>
      </div>
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
      <GroupInfo />
    </Dialog>
  );
});
