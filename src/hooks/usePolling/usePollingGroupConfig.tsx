import React from 'react';
import sleep from 'utils/sleep';
import GroupApi, { GroupUpdatedStatus } from 'apis/group';
import { useStore } from 'store';
import { differenceInMinutes } from 'date-fns';
import { IConfig } from 'store/group';

export const getGroupConfig = async (groupId: string) => {
  const keylist = await GroupApi.GetAppConfigKeyList(groupId) || [];
  const pairs = await Promise.all(
    keylist.map(async (keyItem) => {
      const item = await GroupApi.GetAppConfigItem(groupId, keyItem.Name);
      return [item.Name, item.Value];
    }),
  );

  return Object.fromEntries(pairs) as IConfig;
};

export default (duration: number) => {
  const { groupStore, nodeStore } = useStore();

  React.useEffect(() => {
    let stop = false;
    let initAllAt = 0;

    (async () => {
      while (!stop && !nodeStore.quitting) {
        try {
          const groupConfigs = await Promise.all(
            groupStore.groups
              .filter((group) => {
                if (!initAllAt) {
                  initAllAt = Date.now();
                  return true;
                }
                return group.updatedStatus === GroupUpdatedStatus.ACTIVE || differenceInMinutes(Date.now(), initAllAt) % 5 === 0;
              })
              .map(async (group) => {
                const configObject = await getGroupConfig(group.group_id);
                return [group.group_id, configObject] as [string, IConfig];
              }),
          );
          if (groupConfigs.length > 0) {
            groupStore.setConfigMap(groupConfigs);
          }
        } catch (_err) {}
        await sleep(duration);
      }
    })();

    return () => {
      stop = true;
    };
  }, [groupStore, duration]);
};
