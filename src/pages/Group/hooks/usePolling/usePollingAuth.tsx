import React from 'react';
import { sleep } from 'utils';
import GroupApi from 'apis/group';
import { useStore } from 'store';

export default (duration: number) => {
  const { activeGroupStore, authStore } = useStore();

  React.useEffect(() => {
    let stop = false;

    (async () => {
      await sleep(1000);
      while (!stop) {
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
        console.error(err);
      }
    }

    return () => {
      stop = true;
    };
  }, [activeGroupStore]);
};
