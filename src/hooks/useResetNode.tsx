import React from 'react';
import { useStore } from 'store';
import ElectronNodeStore from 'store/electronNodeStore';

export default () => {
  const { nodeStore } = useStore();

  return React.useCallback(() => {
    nodeStore.reset();
    ElectronNodeStore.getStore()?.clear();
  }, []);
};
