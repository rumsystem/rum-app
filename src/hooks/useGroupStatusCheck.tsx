import { GroupStatus } from 'apis/group';
import React from 'react';
import { useStore } from 'store';

interface CustomMessage {
  [GroupStatus.SYNCING]: string
  [GroupStatus.SYNC_FAILED]: string
}

export default () => {
  const { groupStore, snackbarStore } = useStore();

  const check = React.useCallback(
    /**
     * 检查群组是否为 idle，为 idle 时返回 `true`
     * @param showSnack - 显示错误提示，默认 `true`
     */
    (groupId: string, showSnack: boolean = true, customMessage?: CustomMessage) => {
      const group = groupStore.map[groupId];
      if (!group) {
        return false;
      }

      if (group.group_status === GroupStatus.IDLE) {
        return true;
      }

      if (showSnack) {
        const message = (customMessage ?? {
          [GroupStatus.SYNCING]: '群组正在同步，完成之后即可发送内容',
          [GroupStatus.SYNC_FAILED]: '群组同步失败了，无法发送内容',
        })[group.group_status];

        snackbarStore.show({
          message,
          type: 'error',
        });
      }

      return false;
    },
    [],
  );

  return check;
};
