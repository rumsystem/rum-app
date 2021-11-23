import usePollingMyNodeInfo from './usePollingMyNodeInfo';
import usePollingNetwork from './usePollingNetwork';
import usePollingGroups from './usePollingGroups';
import usePollingAuth from './usePollingAuth';
import usePollingContent from './usePollingContent';
import userPollingAnnouncedProducers from './userPollingAnnouncedProducers';
import userPollingApprovedProducers from './userPollingApprovedProducers';

import useHandleObject from './useHandleContent/object';
import useHandlePerson from './useHandleContent/person';
import useHandleComment from './useHandleContent/comment';

export default () => {
  const SECONDS = 1000;

  usePollingMyNodeInfo(4 * SECONDS);
  usePollingNetwork(4 * SECONDS);
  usePollingGroups(2 * SECONDS);
  usePollingAuth(10 * SECONDS);
  usePollingContent(2 * SECONDS);
  userPollingAnnouncedProducers(15 * SECONDS);
  userPollingApprovedProducers(15 * SECONDS);

  useHandleObject(2 * SECONDS);
  useHandlePerson(4 * SECONDS);
  useHandleComment(4 * SECONDS);
};
