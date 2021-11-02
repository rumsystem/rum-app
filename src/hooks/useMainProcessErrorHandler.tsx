import React from 'react';
import { useStore } from 'store';
import { ipcRenderer } from 'electron';
import { isDevelopment } from 'utils/env';
import { remote } from 'electron';
export default () => {
  const { confirmDialogStore } = useStore();

  React.useEffect(() => {
    if (isDevelopment) {
      ipcRenderer.on('show-main-error', async (_event, errorText: string) => {
        confirmDialogStore.show({
          content: errorText,
          okText: '确定',
          cancelDisabled: true,
          ok: async () => {
            remote.app.quit();
          },
        });
      });
    }
  }, []);
};
