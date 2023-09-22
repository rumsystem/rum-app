import React from 'react';
import { useStore } from 'store';
import useSubmitObject from 'hooks/useSubmitObject';
import { OBJECT_STATUS_DELETED_LABEL } from 'utils/constant';
import { lang } from 'utils/lang';
import sleep from 'utils/sleep';

export default () => {
  const { snackbarStore, confirmDialogStore } = useStore();
  const submitObject = useSubmitObject();

  return React.useCallback((trxId: string) => {
    confirmDialogStore.show({
      content: lang.confirmToDeletePost,
      okText: lang.yes,
      ok: async () => {
        confirmDialogStore.setLoading(true);
        try {
          await submitObject({
            id: trxId,
            content: OBJECT_STATUS_DELETED_LABEL,
          });
          confirmDialogStore.hide();
          await sleep(300);
          snackbarStore.show({
            message: lang.deleted,
          });
        } catch (_) {}
        confirmDialogStore.setLoading(false);
      },
    });
  }, []);
};
