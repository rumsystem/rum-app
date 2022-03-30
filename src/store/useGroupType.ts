import useActiveGroup from './selectors/useActiveGroup';

export default () => {
  const activeGroup = useActiveGroup();
  const result = {
    isForum: false,
    isSocialNetwork: false,
    isNote: false,
  };

  if (activeGroup.GroupName.includes('论坛')) {
    result.isForum = true;
  } else if (activeGroup.GroupName.includes('笔记')) {
    result.isNote = true;
  } else {
    result.isSocialNetwork = true;
  }

  return result;
};
