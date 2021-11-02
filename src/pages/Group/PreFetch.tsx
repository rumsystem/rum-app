import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { useStore } from 'store';
import GroupApi from 'apis/group';
import Bootstrap from './Bootstrap';

export default observer(() => {
  const { activeGroupStore, groupStore, nodeStore } = useStore();
  const state = useLocalObservable(() => ({
    isFetched: false,
    isQuitting: false,
    showGroupEditorModal: false,
    showJoinGroupModal: false,
  }));

  React.useEffect(() => {
    (async () => {
      try {
        const [info, { groups }, network] = await Promise.all([
          GroupApi.fetchMyNodeInfo(),
          GroupApi.fetchMyGroups(),
          GroupApi.fetchNetwork(),
        ]);

        nodeStore.setInfo(info);
        nodeStore.setNetwork(network);
        if (groups && groups.length > 0) {
          groupStore.addGroups(groups);
          const firstGroup = groupStore.groups[0];
          activeGroupStore.setId(firstGroup.GroupId);
        }
        state.isFetched = true;
      } catch (err) {
        console.error(err);
      }
    })();
  }, [state]);

  if (!state.isFetched) {
    return null;
  }

  return <Bootstrap />;
});
