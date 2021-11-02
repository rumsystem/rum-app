import usePollingMyNodeInfo from './usePollingMyNodeInfo';
import usePollingNetwork from './usePollingNetwork';
import usePollingGroups from './usePollingGroups';
import usePollingSyncGroups from './usePollingSyncGroups';
import usePollingAuth from './usePollingAuth';
import usePollingContent from './usePollingContent';

export default () => {
  const SECONDS = 1000;

  usePollingMyNodeInfo(4 * SECONDS);
  usePollingNetwork(4 * SECONDS);
  usePollingGroups(2 * SECONDS);
  usePollingSyncGroups(60 * SECONDS);
  usePollingAuth(10 * SECONDS);
  usePollingContent(2 * SECONDS);
};
