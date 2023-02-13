import React from 'react';
import sleep from 'utils/sleep';
import GroupApi from 'apis/group';
import { useStore } from 'store';
import { runInAction } from 'mobx';

export const getGroupConfig = async (groupId: string) => {
  const keylist = await GroupApi.getGroupConfigKeyList(groupId) || [];
  const pairs = await Promise.all(
    keylist.map(async (keyItem) => {
      const item = await GroupApi.getGroupConfigItem(groupId, keyItem.Name);
      return [item.Name, item.Value];
    }),
  );

  return Object.fromEntries(pairs) as Record<string, string | boolean | number>;
};

export default (duration: number) => {
  const { groupStore, nodeStore } = useStore();

  React.useEffect(() => {
    let stop = false;

    (async () => {
      while (!stop && !nodeStore.quitting) {
        const groupConfigs = await Promise.all(
          groupStore.ids.map(async (id) => {
            const configObject = await getGroupConfig(id);
            return [id, configObject] as const;
          }),
        );
        runInAction(() => {
          groupStore.configMap = new Map(groupConfigs);
        });
        await sleep(duration);
      }
    })();

    return () => {
      stop = true;
    };
  }, [groupStore, duration]);
};
