import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import { ObjectsFilterType } from 'store/activeGroup';
import { useStore } from 'store';

export default observer(() => {
  const { activeGroupStore } = useStore();

  if (activeGroupStore.objectsFilter.type === ObjectsFilterType.ALL) {
    return null;
  }

  return (
    <Fade in={true} timeout={1000}>
      <div
        className={classNames(
          'absolute hidden cursor-pointer bg-white rounded-0 py-2',
          'top-[95px] left-[20px]',
          'lg:block xl:top-[22px] xl:left-[50%] xl:ml-[-425px]',
        )}
        onClick={() => {
          activeGroupStore.setObjectsFilter({
            type: ObjectsFilterType.ALL,
          });
        }}
      >
        <div className="flex flex-center text-gray-88 px-7 py-2 relative leading-none">
          返回
        </div>
      </div>
    </Fade>
  );
});
