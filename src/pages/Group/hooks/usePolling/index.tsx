import usePollingMyNodeInfo from './usePollingMyNodeInfo';
import usePollingNetwork from './usePollingNetwork';
import usePollingMyGroups from './usePollingActiveGroup';
import usePollingAuth from './usePollingAuth';
import usePollingContent from './usePollingContent';

export default () => {
  const DURATION_2_SECONDS = 2 * 1000;
  const DURATION_3_SECONDS = 3 * 1000;
  const DURATION_4_SECONDS = 4 * 1000;
  const DURATION_5_SECONDS = 5 * 1000;
  const DURATION_6_SECONDS = 6 * 1000;
  const DURATION_10_SECONDS = 10 * 1000;

  // usePollingMyNodeInfo(DURATION_4_SECONDS);
  // usePollingNetwork(DURATION_4_SECONDS);
  // usePollingMyGroups(DURATION_3_SECONDS);
  // usePollingAuth(DURATION_10_SECONDS);
  usePollingContent(DURATION_2_SECONDS);
};
