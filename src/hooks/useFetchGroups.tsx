import React from 'react';
import GroupApi from 'apis/group';
import useAddGroups from 'hooks/useAddGroups';

export default () => {
  const addGroups = useAddGroups();

  return React.useCallback(async () => {
    try {
      const { groups } = await GroupApi.fetchMyGroups();
      addGroups(groups ?? []);
    } catch (err) {
      console.error(err);
    }
  }, []);
};
