import React from 'react';
import { observer } from 'mobx-react-lite';
import Button from 'components/Button';
import { joinGroup } from 'standaloneModals/joinGroup';
import { createGroup } from 'standaloneModals/createGroup';
import { lang } from 'utils/lang';

export default observer(() => (
  <div className="-mt-12">
    <div className="pb-3 text-center">{lang.welcomeToUseRum}</div>
    <div className="pb-6 text-center">{lang.youCanTry}</div>
    <div className="flex items-center" data-testid="custom-element">
      <Button
        onClick={() => createGroup()}
      >
        {lang.createGroup}
      </Button>
      <div className="w-6" />
      <Button
        onClick={() => joinGroup()}
        outline
      >
        {lang.joinGroup}
      </Button>
    </div>
  </div>
));
