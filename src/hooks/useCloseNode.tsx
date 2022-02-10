import React from 'react';
import { useStore } from 'store';
import * as Quorum from 'utils/quorum';

export default () => {
  const { nodeStore } = useStore();

  return React.useCallback(async () => {
    try {
      if (nodeStore.status.up) {
        nodeStore.setQuitting(true);
        nodeStore.setConnected(false);
        await Quorum.down();
      }
    } catch (err) {
      console.error(err);
    }
  }, []);
};
