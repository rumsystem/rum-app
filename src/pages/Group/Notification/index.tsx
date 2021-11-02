import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { MdNotificationsNone } from 'react-icons/md';
import MessagesModal from './NotificationModal';
import Badge from '@material-ui/core/Badge';
import { sum } from 'lodash';
import useActiveGroupLatestStatus from 'store/selectors/useActiveGroupLatestStatus';

export default observer(() => {
  const state = useLocalObservable(() => ({
    openMessageModal: false,
  }));
  const latestStatus = useActiveGroupLatestStatus();

  return (
    <div>
      <div
        onClick={() => {
          state.openMessageModal = true;
        }}
      >
        <Badge
          badgeContent={sum(
            Object.values(latestStatus.notificationUnreadCountMap || {}),
          )}
          className="transform scale-90 cursor-pointe"
          color="error"
          onClick={() => {}}
        >
          <div className="text-3xl flex items-center opacity-70">
            <MdNotificationsNone />
          </div>
        </Badge>
      </div>

      <MessagesModal
        open={state.openMessageModal}
        onClose={() => { state.openMessageModal = false; }}
      />
    </div>
  );
});
