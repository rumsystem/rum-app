import useCheckingAnnouncedUsers from './useCheckingAnnouncedUsers';
import useTriggerStartSync from './useTriggerStartSync';

export default () => {
  const SECONDS = 1000;

  useCheckingAnnouncedUsers(20 * SECONDS);
  useTriggerStartSync(30 * 60 * SECONDS);
};
