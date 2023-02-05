import useActiveGroup from './selectors/useActiveGroup';

export default () => {
  const activeGroup = useActiveGroup();
  const result = {
    isForum: false,
    isSocialNetwork: false,
  };

  if (activeGroup.GroupName.includes('论坛')) {
    result.isForum = true;
  } else {
    result.isSocialNetwork = true;
  }

  return result;
};
