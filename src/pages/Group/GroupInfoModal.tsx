import React from 'react';
import { observer } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { useStore } from 'store';
import { ago } from 'utils';
import Tooltip from '@material-ui/core/Tooltip';

interface IProps {
  open: boolean;
  onClose: () => void;
}

const GroupInfo = observer(() => {
  const { groupStore } = useStore();
  const { group } = groupStore;

  return (
    <div className="bg-white rounded-12 p-8">
      <div className="px-5">
        <div className="text-18 font-bold text-gray-700 text-center">
          圈子详情
        </div>
        <div className="pt-8 pb-3 text-gray-88 text-13">
          <div className="flex items-center">
            <span className="w-28 text-gray-4a">ID：</span>
            {group.GroupId}
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-28 text-gray-4a">名称：</span>
            {group.GroupName}
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-28 text-gray-4a">状态：</span>
            {group.GroupStatus}
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-28 text-gray-4a">最近更新：</span>

            {ago(new Date(group.LastUpdate / 1000000).toISOString())}
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-28 text-gray-4a">最新区块：</span>
            {group.LatestBlockId}
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-28 text-gray-4a">最新区块数：</span>
            {group.LatestBlockNum}
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-28 text-gray-4a">OwnerPubKey：</span>
            <Tooltip
              placement="right"
              title={group.OwnerPubKey}
              arrow
              interactive
            >
              <div>
                {group.OwnerPubKey.slice(0, 10) +
                  '...' +
                  group.OwnerPubKey.slice(-20)}
              </div>
            </Tooltip>
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
