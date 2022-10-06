import React from 'react';
import { useStore } from 'store';
import { FilterType } from 'store/activeGroup';
import useDatabase from 'hooks/useDatabase';
import { queryObjects } from 'hooks/useDatabase/selectors/object';

export default () => {
  const { activeGroupStore } = useStore();
  const database = useDatabase();

  return React.useCallback(
    async (basicOptions: {
      GroupId: string;
      limit: number;
      Timestamp?: number;
    }) => {
      const { filterType } = activeGroupStore;
      if (
        [FilterType.FOLLOW, FilterType.ME, FilterType.SOMEONE].includes(
          filterType
        )
      ) {
        return queryObjects(database, {
          ...basicOptions,
          publisherSet: activeGroupStore.filterUserIdSet,
        });
      }

      return queryObjects(database, basicOptions);
    },
    []
  );
};
