import React from 'react';
import { useStore } from 'store';
import useHasPermission from 'store/selectors/useHasPermission';
import useSubmitObject from 'hooks/useSubmitObject';
import { OBJECT_STATUS_DELETED_LABEL } from 'utils/constant';
import { lang } from 'utils/lang';
import sleep from 'utils/sleep';

export default () => {
  const { snackbarStore, confirmDialogStore } = useStore();
  const hasPermission = useHasPermission();
  const submitObject = useSubmitObject();

  return React.useCallback((trxId: string) => {
    confirmDialogStore.show({
      content: '确定删除吗？',
      okText: lang.yes,
      ok: async () => {
        if (!hasPermission) {
          snackbarStore.show({
            message: lang.beBannedTip,
            type: 'error',
            duration: 2500,
          });
          return;
        }
        confirmDialogStore.setLoading(true);
        await submitObject({
          id: trxId,
          content: OBJECT_STATUS_DELETED_LABEL,
        });
        confirmDialogStore.hide();
        await sleep(300);
        snackbarStore.show({
          message: lang.deleted,
        });
      },
    });
  }, []);
};
