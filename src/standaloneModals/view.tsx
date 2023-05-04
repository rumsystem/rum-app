import React from 'react';
import { observer } from 'mobx-react-lite';
import { modalService } from './modal';
import { JoinGroup } from './joinGroup/JoinGroup';

export const ModalView = observer(() => (<>
  {modalService.state.components.map((v) => (
    <React.Fragment key={v.id}>
      {v.name === 'joinGroup' && (<JoinGroup {...v.props} />)}
    </React.Fragment>
  ))}
</>));
