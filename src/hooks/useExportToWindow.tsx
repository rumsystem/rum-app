import React from 'react';
import { useStore } from 'store';
import useDatabase from 'hooks/useDatabase';
import useOffChainDatabase from 'hooks/useOffChainDatabase';
import * as Quorum from 'utils/quorum';

export default () => {
  const store = useStore();
  const database = useDatabase();
  const offChainDatabase = useOffChainDatabase();

  React.useEffect(() => {
    (window as any).store = store;
    (window as any).database = database;
    (window as any).offChainDatabase = offChainDatabase;
    (window as any).Quorum = Quorum;
  }, []);
};
