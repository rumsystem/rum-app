import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';

export default observer(() => {
  const state = useLocalStore(() => ({
    isFetched: true,
  }));

  return (
    <div className="h-300-px bg-indigo-300 flex items-center justify-center">
      流水账单
    </div>
  );
});
