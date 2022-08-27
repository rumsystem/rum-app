import React from 'react';
import Tooltip from '@material-ui/core/Tooltip';

export default () => (
  <Tooltip
    placement="bottom"
    title="请注意，内测版和 live 版本数据不互通"
    arrow
    interactive
  >
    <div
      style={{ zIndex: 10 }}
      className="fixed w-[70px] h-[70px] right-[10px] bottom-[10px] bg-white text-gray-af font-bold text-18 border-4 border-gray-af rounded-full flex items-center justify-center"
    >
      内测版
    </div>
  </Tooltip>
);
