import React from 'react';
import { useStore } from 'store';
import useDatabase from 'hooks/useDatabase';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import { ObjectsFilterType } from 'store/activeGroup';

export default () => {
  const { activeGroupStore } = useStore();
  const database = useDatabase();

  return React.useCallback(
    async (basicOptions: {
      GroupId: string
      limit: number
      TimeStamp?: number
    }) => {
      const { objectsFilter, unFollowingSet, searchText } = activeGroupStore;

      const options = {
        ...basicOptions,
      } as ObjectModel.IListOptions;

      if (objectsFilter.type === ObjectsFilterType.SOMEONE) {
        options.Publisher = objectsFilter.publisher;
      } else if (unFollowingSet.size > 0) {
        options.excludedPublisherSet = unFollowingSet;
      }

      if (searchText) {
        options.searchText = searchText;
      }

      return ObjectModel.list(database, options);
    },
    [],
  );
};
