import React from 'react';
import GroupApi from 'apis/group';
import { useStore } from 'store';
import useDatabase from 'hooks/useDatabase';

export default () => {
  const { groupStore } = useStore();
  const database = useDatabase();

  return React.useCallback(async () => {
    try {
      const { groups } = await GroupApi.fetchMyGroups();
      groupStore.addGroups(groups ?? []);
      groupStore.appendProfile(database);
    } catch (err) {
      console.error(err);
    }
  }, []);
};
