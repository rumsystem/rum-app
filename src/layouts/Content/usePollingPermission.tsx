import React from 'react';
import { useStore } from 'store';
import useCheckPrivatePermission from 'hooks/useCheckPrivatePermission';

export default () => {
  const { activeGroupStore, groupStore, snackbarStore } = useStore();
  const checkPrivatePermission = useCheckPrivatePermission();

  return React.useCallback(() => {
    const timer = setInterval(async () => {
      console.log(' ------------- checkPrivatePermission ---------------');
      try {
        const group = groupStore.map[activeGroupStore.id];
        if (!group) {
          return;
        }
        const hasPermission = await checkPrivatePermission(group);
        console.log({ hasPermission });
        if (hasPermission) {
          activeGroupStore.setPaidRequired(false);
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
