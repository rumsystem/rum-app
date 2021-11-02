import React from 'react';
import { useStore } from 'store';
import { FilterType } from 'store/activeGroup';
import { queryObjects } from 'store/database/selectors/object';

export default () => {
  const { activeGroupStore } = useStore();

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
        return queryObjects({
          ...basicOptions,
          publisherSet: activeGroupStore.filterUserIdSet,
        });
      }

      return queryObjects(basicOptions);
    },
    []
  );
};
