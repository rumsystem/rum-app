import useCheckingProfile from './useCheckingProfile';

export default () => {
  const SECONDS = 1000;

  useCheckingProfile(5 * SECONDS);
};
