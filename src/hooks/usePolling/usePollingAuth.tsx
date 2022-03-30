import React from 'react';
import sleep from 'utils/sleep';
import GroupApi from 'apis/group';
import { useStore } from 'store';

export default (duration: number) => {
  const { activeGroupStore, authStore, nodeStore } = useStore();

  React.useEffect(() => {
    console.log(' ------------- hard code: ---------------');
    let stop = true;

    (async () => {
      await sleep(1000);
      while (!stop && !nodeStore.quitting) {
        await fetchBlacklist();
        await sleep(duration);
      }
    })();

    async function fetchBlacklist() {
      if (!activeGroupStore.isActive) {
        return;
      }

      try {
        const res = await GroupApi.fetchBlacklist();
        authStore.setBlackList((res && res.blocked) || []);
      } catch (err) {
        // console.error(err);
      }
    }

    return () => {
      stop = true;
    };
  }, [activeGroupStore]);
};
