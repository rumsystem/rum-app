import React from 'react';
import { useStore } from 'store';
import useDatabase from 'hooks/useDatabase';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import { ObjectsFilterType } from 'store/activeGroup';

export default () => {
  const { activeGroupStore, groupStore } = useStore();
  const database = useDatabase();

  return React.useCallback(
    async (basicOptions: {
      GroupId: string
      limit: number
      TimeStamp?: number
    }) => {
      const { objectsFilter, followingSet, blockListSet, searchText } = activeGroupStore;
      const activeGroup = groupStore.map[activeGroupStore.id];

      const options = {
        ...basicOptions,
        currentPublisher: activeGroup.user_pubkey,
      } as ObjectModel.IListOptions;

      if (objectsFilter.type === ObjectsFilterType.SOMEONE) {
        options.Publisher = objectsFilter.publisher;
      } else {
        if (objectsFilter.type === ObjectsFilterType.FOLLOW) {
          options.publisherSet = followingSet;
        }
        if (blockListSet.size > 0) {
          options.excludedPublisherSet = blockListSet;
        }
      }

      if (searchText) {
        options.searchText = searchText;
      }

      return ObjectModel.list(database, options);
    },
    [],
  );
};
