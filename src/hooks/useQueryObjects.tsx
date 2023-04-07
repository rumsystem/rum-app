import React from 'react';
import { useStore } from 'store';
import useDatabase from 'hooks/useDatabase';
import * as PostModel from 'hooks/useDatabase/models/posts';
import { ObjectsFilterType } from 'store/activeGroup';
import useActiveGroupFollowingUserAddresses from 'store/selectors/useActiveGroupFollowingUserAddresses';
import useActiveGroupMutedUserAddress from 'store/selectors/useActiveGroupMutedUserAddress';

export interface IOptions {
  GroupId: string
  limit: number
  TimeStamp?: number
  order?: PostModel.Order
}

export default () => {
  const { activeGroupStore, groupStore } = useStore();
  const database = useDatabase();
  const activeGroupFollowingUserAddresses = useActiveGroupFollowingUserAddresses();
  const activeGroupMutedUserAddresses = useActiveGroupMutedUserAddress();

  return React.useCallback(
    async (basicOptions: IOptions) => {
      const { objectsFilter, searchText } = activeGroupStore;
      const activeGroup = groupStore.map[activeGroupStore.id];

      basicOptions.order = basicOptions.order || PostModel.Order.desc;

      const options = {
        ...basicOptions,
        currentPublisher: activeGroup.user_pubkey,
      } as PostModel.IListOptions;

      if (objectsFilter.type === ObjectsFilterType.SOMEONE) {
        options.Publisher = objectsFilter.publisher;
      } else {
        if (objectsFilter.type === ObjectsFilterType.FOLLOW) {
          options.userAddressSet = new Set(activeGroupFollowingUserAddresses);
        }
        if (activeGroupMutedUserAddresses.length > 0) {
          options.excludedUserAddressSet = new Set(activeGroupMutedUserAddresses);
        }
      }

      if (searchText) {
        options.searchText = searchText;
      }

      return PostModel.list(database, options);
    },
    [activeGroupFollowingUserAddresses.length, activeGroupMutedUserAddresses.length],
  );
};
