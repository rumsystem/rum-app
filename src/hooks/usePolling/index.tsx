import usePollingMyNodeInfo from './usePollingMyNodeInfo';
import usePollingNetwork from './usePollingNetwork';
import usePollingGroups from './usePollingGroups';
import usePollingContent from './usePollingContent';
import usePollingToken from './usePollingToken';
import userPollingAnnouncedProducers from './userPollingAnnouncedProducers';
import usePollingGroupConfig from './usePollingGroupConfig';
import usePollingPaidGroupTransaction from './usePollingPaidGroupTransaction';

export default () => {
  const SECONDS = 1000;

  usePollingMyNodeInfo(4 * SECONDS);
  usePollingNetwork(4 * SECONDS);
  usePollingGroups(4 * SECONDS);
  usePollingContent(2 * SECONDS);
  usePollingToken(5 * 60 * SECONDS);
  userPollingAnnouncedProducers(60 * SECONDS);
  usePollingGroupConfig(20 * SECONDS);
  usePollingPaidGroupTransaction(10 * SECONDS);
};
