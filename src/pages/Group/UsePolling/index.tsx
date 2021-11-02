import UsePollingUnreadContents from './UsePollingUnreadContents';
import UsePollingMyNodeInfo from './UsePollingMyNodeInfo';
import UsePollingMyGroups from './UsePollingMyGroups';
import UsePollingAuth from './UsePollingAuth';
import UsePollingGroupUnReadCount from './UsePollingGroupUnReadCount';

export default () => {
  UsePollingUnreadContents();
  UsePollingMyNodeInfo();
  UsePollingMyGroups();
  UsePollingAuth();
  UsePollingGroupUnReadCount();
};
