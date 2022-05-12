import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import { ObjectsFilterType } from 'store/activeGroup';
import { useStore } from 'store';
import { lang } from 'utils/lang';
import { RiUserLine, RiUserStarLine } from 'react-icons/ri';
import useActiveGroupFollowingPublishers from 'store/selectors/useActiveGroupFollowingPublishers';

export default observer((props: {
  className: string
}) => {
  const { activeGroupStore } = useStore();
  const { objectsFilter } = activeGroupStore;
  const activeGroupFollowingPublishers = useActiveGroupFollowingPublishers();
  const filterType = objectsFilter.type;
  const itemsClassName = `${props.className} cursor-pointer bg-white rounded-0 z-10`;
  const itemClassName = 'flex items-center text-gray-88 px-6 py-2 relative leading-none';

  const Item = (current: ObjectsFilterType, filterType: ObjectsFilterType, index: number) => (
    <div
      key={filterType}
      className={classNames(
        {
          'font-bold': current === filterType,
          'opacity-80': current !== filterType,
          'mt-[6px]': index !== 0,
        },
        itemClassName,
      )}
      onClick={() => {
        if (current === filterType) {
          return;
        }
        if (filterType === ObjectsFilterType.ALL) {
          activeGroupStore.setObjectsFilter({
            type: ObjectsFilterType.ALL,
          });
        } else if (filterType === ObjectsFilterType.FOLLOW) {
          activeGroupStore.setObjectsFilter({
            type: ObjectsFilterType.FOLLOW,
            publishers: activeGroupFollowingPublishers,
          });
        }
      }}
    >
      {current === filterType && (
        <div className="absolute top-0 left-[15px] flex items-center py-3 h-full">
          <div className="h-[14px] w-1 bg-black opacity-60" />
        </div>
      )}
      {filterType === ObjectsFilterType.ALL && (
        <div className="flex items-center leading-none">
          <RiUserLine className="text-15 mr-1" />
          {lang.all}
        </div>
      )}
      {filterType === ObjectsFilterType.FOLLOW && (
        <div className="flex items-center leading-none">
          <RiUserStarLine className="text-15 mr-1" />
          {lang.followLabel}
        </div>
      )}
    </div>
  );

  return (
    <div>
      {[ObjectsFilterType.ALL, ObjectsFilterType.FOLLOW].includes(filterType) && (
        <div>
          <Fade in={true} timeout={800}>
            <div className={`${itemsClassName} py-3`}>
              {[ObjectsFilterType.ALL, ObjectsFilterType.FOLLOW].map((_filterType, index) =>
                Item(filterType, _filterType, index))}
            </div>
          </Fade>
        </div>
      )}
      {[ObjectsFilterType.SOMEONE].includes(filterType) && (
        <div>
          <Fade in={true} timeout={1000}>
            <div className={`${itemsClassName} py-2`}>
              <div
                className={itemClassName}
                onClick={() => {
                  activeGroupStore.setObjectsFilter({
                    type: ObjectsFilterType.ALL,
                  });
                }}
              >
                {lang.back}
              </div>
            </div>
          </Fade>
        </div>
      )}
    </div>
  );
});
