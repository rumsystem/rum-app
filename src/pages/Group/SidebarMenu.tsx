import React from 'react';
import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import { useStore } from 'store';
import { FilterType } from 'store/activeGroup';
import { sleep } from 'utils';
import Fade from '@material-ui/core/Fade';

export default observer(() => {
  const { activeGroupStore, nodeStore } = useStore();
  const { filterType } = activeGroupStore;

  const Item = (current: FilterType, filterType: FilterType, index: number) => (
    <div
      key={filterType}
      className={classNames(
        {
          'font-bold': current === filterType,
          'opacity-80': current !== filterType,
          'mt-2': index !== 0,
        },
        'flex items-center justify-center text-gray-88 px-7 py-2 relative leading-none'
      )}
      onClick={async () => {
        if (current === filterType) {
          return;
        }
        activeGroupStore.setLoading(true);
        if (filterType === FilterType.ALL) {
          activeGroupStore.setFilterUserIds([]);
        } else if (filterType === FilterType.FOLLOW) {
          activeGroupStore.setFilterUserIds(activeGroupStore.following);
        } else if (filterType === FilterType.ME) {
          activeGroupStore.setFilterUserIds([nodeStore.info.node_publickey]);
        }
        activeGroupStore.setFilterType(filterType);
        await sleep(400);
        activeGroupStore.setLoading(false);
      }}
    >
      {current === filterType && (
        <div className="absolute top-0 left-[15px] flex items-center py-3 h-full">
          <div className="h-[14px] w-1 bg-gray-9b" />
        </div>
      )}
      {filterType === FilterType.ALL && '全部'}
      {filterType === FilterType.FOLLOW && '关注'}
      {filterType === FilterType.ME && '我的'}
    </div>
  );

  return (
    <Fade in={true} timeout={500}>
      <div className="fixed top-[76px] left-[50%] ml-[-325px] cursor-pointer bg-white py-3 rounded-12">
        {[FilterType.ALL, FilterType.FOLLOW, FilterType.ME].map(
          (_filterType, index) => Item(filterType, _filterType, index)
        )}
      </div>
    </Fade>
  );
});
