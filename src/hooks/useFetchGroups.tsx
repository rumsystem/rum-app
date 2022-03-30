import React from 'react';
import GroupApi from 'apis/group';
// import { useStore } from 'store';
// import useDatabase from 'hooks/useDatabase';
import useAddGroups from 'hooks/useAddGroups';

export default () => {
  // const { groupStore } = useStore();
  // const database = useDatabase();
  const addGroups = useAddGroups();

  return React.useCallback(async () => {
    try {
      const { groups } = await GroupApi.fetchMyGroups();
      addGroups(groups ?? []);
      // groupStore.appendProfile(database);
    } catch (err) {
      console.error(err);
    }
  }, []);
};
