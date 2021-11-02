import React from 'react';
import { sleep } from 'utils';
import GroupApi from 'apis/group';
import { useStore } from 'store';

export default () => {
  const { groupStore } = useStore();

  React.useEffect(() => {
    let stop = false;
    const DURATION_3_SECONDS = 3 * 1000;

    (async () => {
      await sleep(1500);
      while (!stop) {
        await fetchMyGroups();
        await sleep(DURATION_3_SECONDS);
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
