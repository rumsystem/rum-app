import React from 'react';
import { sleep } from 'utils';
import GroupApi from 'apis/group';
import { useStore } from 'store';

export default (duration: number) => {
  const { groupStore } = useStore();

  React.useEffect(() => {
    let stop = false;

    (async () => {
      await sleep(1500);
      while (!stop) {
        await fetchMyGroups();
        await sleep(duration);
      }
    })();

    async function fetchMyGroups() {
      if (!groupStore.isSelected) {
        return;
      }
      try {
        const { groups } = await GroupApi.fetchMyGroups();
        groupStore.updateGroups(groups || []);
      } catch (err) {
        console.log(err.message);
      }
    }

    return () => {
      stop = true;
    };
  }, [groupStore]);
};
