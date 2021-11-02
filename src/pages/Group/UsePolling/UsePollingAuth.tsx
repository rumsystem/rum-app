import React from 'react';
import { sleep } from 'utils';
import GroupApi from 'apis/group';
import { useStore } from 'store';

export default (duration: number) => {
  const { groupStore, authStore } = useStore();

  React.useEffect(() => {
    let stop = false;
    let errorCount = 0;

    (async () => {
      await sleep(1000);
      while (!stop) {
        await fetchBlacklist();
        await sleep(duration);
      }
    })();

    async function fetchBlacklist() {
      if (!groupStore.isSelected) {
        return;
      }

      try {
        const res = await GroupApi.fetchBlacklist();
        authStore.setBlackList((res && res.blocked) || []);
        errorCount = 0;
      } catch (err) {
        errorCount++;
        console.log(err.message);
      }
    }

    return () => {
      stop = true;
    };
  }, [groupStore]);
};
