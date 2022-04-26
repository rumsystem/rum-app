import React from 'react';
import { useStore } from 'store';
import useDatabase from 'hooks/useDatabase';
import * as Quorum from 'utils/quorum';

export default () => {
  const store = useStore();
  const database = useDatabase();

  React.useEffect(() => {
    (window as any).store = store;
    (window as any).database = database;
    (window as any).Quorum = Quorum;
  }, []);
};
