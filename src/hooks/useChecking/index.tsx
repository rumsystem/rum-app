import useCheckingAnnouncedUsers from './useCheckingAnnouncedUsers';
import useCheckingJoiningSubGroups from './useCheckingJoiningSubGroups';

export default () => {
  const SECONDS = 1000;

  useCheckingAnnouncedUsers(20 * SECONDS);
  useCheckingJoiningSubGroups(10 * SECONDS);
};
