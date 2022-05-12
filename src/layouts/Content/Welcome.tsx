import React from 'react';
import { observer } from 'mobx-react-lite';
import Button from 'components/Button';
import { joinGroup } from 'standaloneModals/joinGroup';
import { createGroup } from 'standaloneModals/createGroup';

export default observer(() => (
  <div>
    <div className="pb-3 text-center">欢迎使用 Rum</div>
    <div className="pb-6 text-center">你可以试试</div>
    <div className="flex items-center">
      <Button
        onClick={() => createGroup()}
      >
        创建群组
      </Button>
      <div className="w-6" />
      <Button
        onClick={() => joinGroup()}
        outline
      >
        加入群组
      </Button>
    </div>
  </div>
));
