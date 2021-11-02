import React from 'react';
import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import { useStore } from 'store';
import { FilterType } from 'store/activeGroup';
import { sleep } from 'utils';
import Fade from '@material-ui/core/Fade';
import Database from 'store/database';

export default observer(() => {
  const { activeGroupStore, nodeStore } = useStore();
  const { filterType } = activeGroupStore;
  const itemsClassName =
    'fixed top-[76px] left-0 ml-[276px] hidden lg:block xl:left-[50%] xl:ml-[-325px] cursor-pointer bg-white py-3 rounded-12';
  const itemClassName =
    'flex items-center justify-center text-gray-88 px-7 py-2 relative leading-none';

  const Item = (current: FilterType, filterType: FilterType, index: number) => (
    <div
      key={filterType}
      className={classNames(
        {
          'font-bold': current === filterType,
          'opacity-80': current !== filterType,
          'mt-[6px]': index !== 0,
        },
        itemClassName
      )}
      onClick={async () => {
        if (current === filterType) {
          return;
        }
        activeGroupStore.setLoading(true);
        if (filterType === FilterType.ALL) {
          activeGroupStore.setFilterUserIdSet([]);
        } else if (filterType === FilterType.FOLLOW) {
          const follows = await new Database().mockFollows
            .where({
              GroupId: activeGroupStore.id,
              Publisher: nodeStore.info.node_publickey,
            })
            .toArray();
          activeGroupStore.setFilterUserIdSet(
            follows.map((follow) => follow.Following)
          );
        }
        activeGroupStore.setFilterType(filterType);
        await sleep(300);
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
    </div>
  );

  return (
    <div>
      {[FilterType.ALL, FilterType.FOLLOW].includes(filterType) && (
        <div>
          <Fade in={true} timeout={350}>
            <div className={itemsClassName}>
              {[FilterType.ALL, FilterType.FOLLOW].map((_filterType, index) =>
                Item(filterType, _filterType, index)
              )}
            </div>
          </Fade>
        </div>
      )}
      {[FilterType.ME, FilterType.SOMEONE].includes(filterType) && (
        <div>
          <Fade in={true} timeout={800}>
            <div className={itemsClassName}>
              <div
                className={itemClassName}
                onClick={async () => {
                  activeGroupStore.setLoading(true);
                  activeGroupStore.setFilterUserIdSet([]);
                  activeGroupStore.setFilterType(FilterType.ALL);
                  await sleep(400);
                  activeGroupStore.setLoading(false);
                }}
              >
                返回
              </div>
            </div>
          </Fade>
        </div>
      )}
    </div>
  );
});
