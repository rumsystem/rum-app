import React from 'react';
import { useStore } from 'store';
import useCheckPaidGroupAnounce from 'hooks/useCheckPaidGroupAnounce';

export default () => {
  const { activeGroupStore, groupStore, snackbarStore } = useStore();
  const checkPaidGroupAnounce = useCheckPaidGroupAnounce();

  return React.useCallback(() => {
    const timer = setInterval(async () => {
      try {
        const group = groupStore.map[activeGroupStore.id];
        if (!group) {
          return;
        }
        const hasAnounce = await checkPaidGroupAnounce(group);
        if (hasAnounce) {
          activeGroupStore.setAnoucePaidGroupRequired(false);
          clearInterval(timer);
          snackbarStore.show({
            message: '您可以开始使用了',
          });
        }
      } catch (err) {
        console.log(err);
      }
    }, 2000);
    return timer;
  }, []);
};
