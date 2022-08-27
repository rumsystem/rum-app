import useCheckingProfile from './useCheckingProfile';
import useCheckingAnnouncedUsers from './useCheckingAnnouncedUsers';

export default () => {
  const SECONDS = 1000;

  useCheckingProfile(5 * SECONDS);
  useCheckingAnnouncedUsers(20 * SECONDS);
};
