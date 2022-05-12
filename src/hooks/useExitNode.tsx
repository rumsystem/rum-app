import React from 'react';
import { useStore } from 'store';
import * as Quorum from 'utils/quorum';
import useOffChainDatabase from 'hooks/useOffChainDatabase';
import * as offChainDatabaseExportImport from 'hooks/useOffChainDatabase/exportImport';

export default () => {
  const { nodeStore } = useStore();
  const offChainDatabase = useOffChainDatabase();

  return React.useCallback(async () => {
    try {
      if (nodeStore.status.up) {
        await offChainDatabaseExportImport.exportTo(
          offChainDatabase,
          nodeStore.storagePath,
        );
        nodeStore.setQuitting(true);
        nodeStore.setConnected(false);
        await Quorum.down();
      }
    } catch (err) {
      console.error(err);
    }
  }, []);
};
