import React from 'react';
import { useStore } from 'store';

export default (changed: () => void) => {
  const { activeGroupStore } = useStore();
  const preGroupIdRef = React.useRef(activeGroupStore.id);

  React.useEffect(() => {
    if (preGroupIdRef.current && preGroupIdRef.current !== activeGroupStore.id) {
      changed();
    }
    preGroupIdRef.current = activeGroupStore.id;
  }, [activeGroupStore.id]);

  return null;
};
