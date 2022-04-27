import React from 'react';
import { ipcRenderer } from 'electron';

import { useStore } from 'store';
import useExitNode from 'hooks/useExitNode';

import { TitleBar } from './TitleBar';
import { Init } from './Init';
import { CreateGroup } from './CreateGroup';
import Content from './Content';

export default () => {
  const store = useStore();
  const [inited, setInited] = React.useState(false);
  const exitNode = useExitNode();

  const handleToggleMode = async () => {
    store.modalStore.pageLoading.show();
    store.nodeStore.setQuitting(true);
    store.nodeStore.resetElectronStore();
    if (store.nodeStore.mode === 'EXTERNAL') {
      store.nodeStore.setMode('INTERNAL');
    } else {
      store.nodeStore.setMode('EXTERNAL');
    }
    await exitNode();
    window.location.reload();
  };

  React.useEffect(() => {
    ipcRenderer.on('toggle-mode', handleToggleMode);
    return () => {
      ipcRenderer.off('toggle-mode', handleToggleMode);
    };
  });

  return (
    <div className="flex flex-col h-screen w-screen">
      <TitleBar className="flex-none items-stretch" />

      <div className="flex-1 h-0 relative">
        {!inited && (
          <Init onInitSuccess={() => setInited(true)} />
        )}
        {inited && (
          <Content />
        )}

        <CreateGroup />
      </div>
    </div>
  );
};
