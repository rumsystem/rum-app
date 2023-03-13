import GroupApi, { GroupUpdatedStatus } from 'apis/group';
import { store } from 'store';
import { runInAction } from 'mobx';
import { differenceInMinutes } from 'date-fns';

export const getGroupConfigRecord = async (groupId: string) => {
  const keylist = await GroupApi.GetAppConfigKeyList(groupId) || [];
  const pairs = await Promise.all(
    keylist.map(async (keyItem) => {
      const item = await GroupApi.GetAppConfigItem(groupId, keyItem.Name);
      return [item.Name, item.Value];
    }),
  );

  return Object.fromEntries(pairs) as Record<string, string | boolean | number>;
};

export const getGroupConfig = () => {
  const { groupStore, nodeStore } = store;
  let initAllAt = 0;

  return async () => {
    if (!nodeStore.quitting) {
      await run();
    }

    async function run() {
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
              const configObject = await getGroupConfigRecord(group.group_id);
              return [group.group_id, configObject] as const;
            }),
        );
        runInAction(() => {
          for (const config of groupConfigs) {
            groupStore.configMap.set(config[0], config[1]);
          }
        });
      } catch (_err) { }
    }
  };
};
