import React from 'react';
import sleep from 'utils/sleep';
import GroupApi from 'apis/group';
import { useStore } from 'store';

export default (duration: number) => {
  const { activeGroupStore, authStore, nodeStore } = useStore();

  React.useEffect(() => {
    let stop = false;

    (async () => {
      await sleep(1000);
      while (!stop && !nodeStore.quitting) {
        await fetchDeniedList(activeGroupStore.id);
        await sleep(duration);
      }
    })();

    async function fetchDeniedList(groupId: string) {
      if (!activeGroupStore.isActive) {
        return;
      }

      try {
        const res = await GroupApi.fetchDeniedList(groupId);
        authStore.setDeniedList(res || []);
      } catch (err) {
        // console.error(err);
      }
    }

    return () => {
      stop = true;
    };
  }, [activeGroupStore]);
};
