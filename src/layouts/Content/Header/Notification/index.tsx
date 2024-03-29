import React from 'react';
import classNames from 'classnames';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { sum } from 'lodash';
import { MdNotificationsNone } from 'react-icons/md';
import { Badge } from '@mui/material';
import useActiveGroupLatestStatus from 'store/selectors/useActiveGroupLatestStatus';
import MessagesModal from './NotificationModal';

interface Props {
  className?: string
}

export default observer((props: Props) => {
  const state = useLocalObservable(() => ({
    openMessageModal: false,
  }));
  const latestStatus = useActiveGroupLatestStatus();

  return (<>
    <Badge
      badgeContent={sum(
        Object.values(latestStatus.notificationUnreadCountMap || {}),
      )}
      className={classNames(
        'transform cursor-pointer',
        props.className,
      )}
      color="error"
      onClick={action(() => { state.openMessageModal = true; })}
    >
      <MdNotificationsNone />
    </Badge>

    <MessagesModal
      open={state.openMessageModal}
      onClose={() => { state.openMessageModal = false; }}
    />
  </>);
});
