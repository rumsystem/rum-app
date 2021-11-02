import UsePollingMyNodeInfo from './usePollingMyNodeInfo';
import UsePollingMyGroups from './usePollingMyGroups';
import UsePollingAuth from './usePollingAuth';
import UsePollingGroupUnReadCount from './usePollingGroupUnReadCount';

export default () => {
  const DURATION_3_SECONDS = 3 * 1000;
  const DURATION_4_SECONDS = 4 * 1000;
  const DURATION_8_SECONDS = 8 * 1000;
  const DURATION_10_SECONDS = 10 * 1000;

  UsePollingMyNodeInfo(DURATION_4_SECONDS);
  UsePollingMyGroups(DURATION_3_SECONDS);
  UsePollingAuth(DURATION_10_SECONDS);
  UsePollingGroupUnReadCount(DURATION_8_SECONDS);
};
