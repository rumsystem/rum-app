import UsePollingUnreadContents from './UsePollingUnreadContents';
import UsePollingMyNodeInfo from './UsePollingMyNodeInfo';
import UsePollingMyGroups from './UsePollingMyGroups';

export default () => {
  UsePollingUnreadContents();
  UsePollingMyNodeInfo();
  UsePollingMyGroups();
};
