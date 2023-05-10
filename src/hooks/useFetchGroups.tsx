import React from 'react';
import GroupApi from 'apis/group';
import { useStore } from 'store';

export default () => {
  const { groupStore } = useStore();

  return React.useCallback(async () => {
    try {
      const { groups } = await GroupApi.fetchMyGroups();
      groupStore.addGroups(groups ?? []);
    } catch (err) {
      console.error(err);
    }
  }, []);
};
