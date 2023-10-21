import useCheckingAnnouncedUsers from './useCheckingAnnouncedUsers';

export default () => {
  const SECONDS = 1000;

  useCheckingAnnouncedUsers(20 * SECONDS);
};
