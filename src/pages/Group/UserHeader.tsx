import React from 'react';
import { observer } from 'mobx-react-lite';
import { HiArrowNarrowLeft } from 'react-icons/hi';
import Button from 'components/Button';
import { useStore } from 'store';
import { FilterType } from 'store/activeGroup';
import { sleep } from 'utils';

interface IProps {
  userId: string;
}

export default observer((props: IProps) => {
  const { activeGroupStore } = useStore();

  return (
    <div className="rounded-12 bg-white py-3 pr-6 w-full box-border flex items-center justify-between">
      <div className="flex items-center">
        <div
          className="cursor-pointer px-6 py-2"
          onClick={async () => {
            activeGroupStore.setLoading(true);
            activeGroupStore.setFilterUserIds([]);
            activeGroupStore.setFilterType(FilterType.ALL);
            await sleep(400);
            activeGroupStore.setLoading(false);
          }}
        >
          <HiArrowNarrowLeft className="text-black text-22" />
        </div>
        <div>
          <div className="text-gray-88 font-bold">
            {props.userId.slice(-10, -2)}
          </div>
          <div className="mt-[2px] text-12 text-gray-af tracking-wide">
            {activeGroupStore.countMap[props.userId] || 0} 条内容
          </div>
        </div>
      </div>
      {activeGroupStore.followingSet.has(props.userId) ? (
        <Button
          size="small"
          outline
          onClick={() => {
            activeGroupStore.deleteFollowing(props.userId);
          }}
        >
          正在关注
        </Button>
      ) : (
        <Button
          size="small"
          onClick={() => {
            activeGroupStore.addFollowing(props.userId);
          }}
        >
          关注
        </Button>
      )}
    </div>
  );
});
