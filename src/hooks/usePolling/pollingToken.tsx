import React from 'react';
import sleep from 'utils/sleep';
import GroupApi from 'apis/group';
import { useStore } from 'store';

export default (duration: number) => {
  const { nodeStore } = useStore();

  React.useEffect(() => {
    if (nodeStore.mode !== 'EXTERNAL') {
      return;
    }

    let stop = false;

    (async () => {
      await sleep(1000);
      while (!stop && !nodeStore.quitting) {
        await sleep(duration);
        await refreshToken();
      }
    })();

    async function refreshToken() {
      try {
        const { token } = await GroupApi.refreshToken();
        const apiConfig = {
          ...nodeStore.apiConfig,
          jwt: token,
        };
        nodeStore.setApiConfig(apiConfig);
        nodeStore.updateApiConfigHistory(apiConfig);
      } catch (err) {}
    }

    return () => {
      stop = true;
    };
  }, []);
};
