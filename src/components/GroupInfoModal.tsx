import React from 'react';
import { observer } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import MiddleTruncate from 'components/MiddleTruncate';
import ago from 'utils/ago';
import useActiveGroup from 'store/selectors/useActiveGroup';

interface IProps {
  open: boolean
  onClose: () => void
}

const GroupInfo = observer(() => {
  const activeGroup = useActiveGroup();

  return (
    <div className="bg-white rounded-0 p-8">
      <div className="pt-2 px-6 pb-5">
        <div className="text-18 font-bold text-gray-700 text-center pb-5">
          群组详情
        </div>
        <div className="p-6 text-gray-88 text-13 border border-gray-d8 rounded-0 shadow">
          <div className="flex items-center">
            <span className="w-20">名称：</span>
            <span className="text-gray-4a opacity-90">
              {activeGroup.group_name}
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-20">ID：</span>
            <span className="text-gray-4a opacity-90">
              {activeGroup.group_id}
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-20">创建人：</span>
            <div className="text-gray-4a opacity-90">
              <MiddleTruncate string={activeGroup.owner_pubkey} length={15} />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-20">最新区块：</span>
            <span className="text-gray-4a opacity-90">
              {activeGroup.highest_block_id.join(', ')}
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-20">区块数：</span>
            <span className="text-gray-4a opacity-90">
              {activeGroup.highest_height}
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-20">最近更新：</span>
            <span className="text-gray-4a opacity-90">
              {ago(activeGroup.last_updated)}
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-20">状态：</span>
            <span className="text-gray-4a opacity-90">{activeGroup.group_status}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default observer((props: IProps) => (
  <Dialog
    open={props.open}
    onClose={() => props.onClose()}
    transitionDuration={{
      enter: 300,
    }}
  >
    <GroupInfo />
  </Dialog>
));
