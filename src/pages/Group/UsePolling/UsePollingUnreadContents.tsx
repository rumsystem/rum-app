import React from 'react';
import { sleep } from 'utils';
import GroupApi from 'apis/group';
import { useStore } from 'store';

export default () => {
  const { groupStore } = useStore();

  React.useEffect(() => {
    let stop = false;
    const DURATION_6_SECONDS = 10 * 1000;

    (async () => {
      await sleep(2000);
      while (!stop) {
        await fetchUnReadContents();
        await sleep(DURATION_6_SECONDS);
      }
    })();

    async function fetchUnReadContents() {
      if (!groupStore.isSelected) {
        return;
      }
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
        console.log(err.message);
      }
    }

    return () => {
      stop = true;
    };
  }, [groupStore]);
};
