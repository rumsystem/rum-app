import React from 'react';
import { observer } from 'mobx-react-lite';
import { ObjectsFilterType } from 'store/activeGroup';
import Fade from '@material-ui/core/Fade';
import { useStore } from 'store';

export default observer(() => {
  const { activeGroupStore } = useStore();

  if (activeGroupStore.objectsFilter.type === ObjectsFilterType.ALL) {
    return null;
  }

  return (
    <Fade in={true} timeout={1000}>
      <div
        className="fixed top-[76px] left-0 ml-[276px] hidden lg:block xl:left-[50%] xl:ml-[-325px] cursor-pointer bg-white rounded-12 py-2"
        onClick={() => {
          activeGroupStore.setObjectsFilter({
            type: ObjectsFilterType.ALL,
          });
        }}
      >
        <div className="flex items-center justify-center text-gray-88 px-7 py-2 relative leading-none">返回</div>
      </div>
    </Fade>
  );
});
