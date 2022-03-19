import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import classNames from 'classnames';
import { BsPencil } from 'react-icons/bs';
import openObjectEditor from './OpenObjectEditor';

export default observer(() => {
  const { sidebarStore } = useStore();

  return (
    <div>
      <div
        className={classNames({
          '2lg:ml-[-250px] 2lg:scale-100 2lg:top-[255px] 2lg:left-[50%]': !sidebarStore.collapsed,
          'lg:ml-[-397px] lg:scale-100 lg:top-[255px] lg:left-[50%]': sidebarStore.collapsed,
        }, 'w-13 h-13 bg-black rounded-full flex items-center justify-center fixed bottom-[20px] right-[30px] scale-90 z-10 cursor-pointer')}
        onClick={() => {
          openObjectEditor();
        }}
      >
        <BsPencil className="text-22 opacity-95 text-white" />
      </div>
    </div>
  );
});
