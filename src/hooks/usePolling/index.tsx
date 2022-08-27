import usePollingMyNodeInfo from './usePollingMyNodeInfo';
import usePollingNetwork from './usePollingNetwork';
import usePollingGroups from './usePollingGroups';
import usePollingAuth from './usePollingAuth';
import usePollingContent from './usePollingContent';
import pollingToken from './pollingToken';
import userPollingAnnouncedProducers from './userPollingAnnouncedProducers';
import userPollingApprovedProducers from './userPollingApprovedProducers';
import usePollingGroupConfig from './usePollingGroupConfig';

export default () => {
  const SECONDS = 1000;

  usePollingMyNodeInfo(4 * SECONDS);
  usePollingNetwork(4 * SECONDS);
  usePollingGroups(2 * SECONDS);
  usePollingAuth(10 * SECONDS);
  usePollingContent(2 * SECONDS);
  pollingToken(5 * 60 * SECONDS);
  userPollingAnnouncedProducers(15 * SECONDS);
  userPollingApprovedProducers(15 * SECONDS);
  usePollingGroupConfig(30 * SECONDS);
};
