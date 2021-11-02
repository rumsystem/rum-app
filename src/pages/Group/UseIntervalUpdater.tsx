import React from 'react';
import { sleep } from 'utils';
import GroupApi from 'apis/group';
import { useStore } from 'store';

export default () => {
  const { groupStore } = useStore();

  // fetchUnReadContents
  React.useEffect(() => {
    if (!groupStore.isSelected) {
      return;
    }

    let stop = false;
    const DURATION_6_SECOND = 6 * 1000;

    const fetchUnReadContents = async () => {
      try {
        const contents = await GroupApi.fetchContents(groupStore.id);
        if (!contents || contents.length === 0) {
          return;
        }
        let unReadContents = contents.filter((content) => {
          return (
            !groupStore.contentMap[content.TrxId] &&
            !groupStore.unReadContentTrxIds.includes(content.TrxId)
          );
        });
        if (unReadContents.length === 0) {
          return;
        }
        groupStore.addUnreadContents(unReadContents);
      } catch (err) {
        console.log(err);
      }
    };

    (async () => {
      await sleep(2000);
      while (!stop) {
        await fetchUnReadContents();
        await sleep(DURATION_6_SECOND);
      }
    })();

    return () => {
      stop = true;
    };
  }, [groupStore]);

  // fetchMyNodeInfo
  React.useEffect(() => {
    if (!groupStore.isSelected) {
      return;
    }

    let stop = false;
    let errorCount = 0;
    const DURATION_4_SECOND = 4 * 1000;

    const fetchMyNodeInfo = async () => {
      try {
        const nodeInfo = await GroupApi.fetchMyNodeInfo();
        groupStore.updateNodeStatus(nodeInfo.node_status);
        errorCount = 0;
      } catch (err) {
        if (errorCount > 0) {
          groupStore.updateNodeStatus('NODE_OFFLINE');
        }
        errorCount++;
        console.log(err);
      }
    };

    (async () => {
      await sleep(1000);
      while (!stop) {
        await fetchMyNodeInfo();
        await sleep(DURATION_4_SECOND);
      }
    })();

    return () => {
      stop = true;
    };
  }, [groupStore]);

  // fetchMyGroups
  React.useEffect(() => {
    if (!groupStore.isSelected) {
      return;
    }

    let stop = false;
    const DURATION_3_SECOND = 3 * 1000;

    const fetchMyGroups = async () => {
      try {
        const { groups } = await GroupApi.fetchMyGroups();
        groupStore.updateGroups(groups || []);
      } catch (err) {
        console.log(err);
      }
    };

    (async () => {
      await sleep(1500);
      while (!stop) {
        await fetchMyGroups();
        await sleep(DURATION_3_SECOND);
      }
    })();

    return () => {
      stop = true;
    };
  }, [groupStore]);
};
