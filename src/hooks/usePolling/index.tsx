import React from 'react';
import { myNodeInfo } from './myNodeInfo';
import { network } from './network';
import { groups } from './groups';
import { contentTaskManager, socketManager } from './content';
import { token } from './token';
import { getAnouncedProducers } from './announcedProducers';
import { getGroupConfig } from './groupConfig';
import { transferTransactions } from './transferTransactions';
import { PollingTask } from 'utils';

export default () => {
  const SECONDS = 1000;

  const jobs = React.useMemo(() => ({
    myNodeInfo: new PollingTask({ task: myNodeInfo, interval: 4 * SECONDS }),
    network: new PollingTask({ task: network, interval: 4 * SECONDS }),
    groups: new PollingTask({ task: groups, interval: 4 * SECONDS }),
    content: contentTaskManager,
    token: new PollingTask({ task: token, interval: 5 * 60 * SECONDS }),
    announcedProducers: new PollingTask({ task: getAnouncedProducers(), interval: 60 * SECONDS }),
    groupConfig: new PollingTask({ task: getGroupConfig(), interval: 20 * SECONDS }),
    transferTransactions: new PollingTask({ task: transferTransactions, interval: 10 * SECONDS }),
    socket: socketManager,
  }), []);

  React.useEffect(() => {
    socketManager.start();
    contentTaskManager.start();

    return () => {
      Object.values(jobs).forEach((v) => {
        v.stop();
      });
    };
  }, []);
};
