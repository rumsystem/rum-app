import React from 'react';
import { useStore } from 'store';
import { ipcRenderer } from 'electron';
import { dialog } from '@electron/remote';
import sleep from 'utils/sleep';
import useExitNode from 'hooks/useExitNode';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { lang } from 'utils/lang';

export default () => {
  const { confirmDialogStore, groupStore } = useStore();
  const activeGroup = useActiveGroup();
  const exitNode = useExitNode();

  React.useEffect(() => {
    ipcRenderer.send('app-quit-prompt');
    ipcRenderer.on('app-before-quit', async () => {
      if (
        confirmDialogStore.open
        && confirmDialogStore.loading
        && confirmDialogStore.okText === lang.reload
      ) {
        confirmDialogStore.hide();
      } else {
        const ownerGroupCount = groupStore.groups.filter(
          (group) => group.owner_pubkey === activeGroup.user_pubkey,
        ).length;
        const res = await dialog.showMessageBox({
          type: 'question',
          buttons: [lang.yes, lang.cancel],
          title: lang.exitNode,
          message: ownerGroupCount
            ? lang.exitConfirmTextWithGroupCount(ownerGroupCount)
            : lang.exitConfirmText,
        });
        if (res.response === 1) {
          return;
        }
      }
      ipcRenderer.send('disable-app-quit-prompt');
      await sleep(500);
      await exitNode();
      ipcRenderer.send('app-quit');
    });
  }, []);
};
