import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import ObjectItem from './ObjectItem';
import { useStore } from 'store';
import { IObjectItem } from 'apis/group';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import { sleep } from 'utils';
import Fade from '@material-ui/core/Fade';
import usePrevious from 'hooks/usePrevious';

export default observer(() => {
  const { activeGroupStore } = useStore();
  const state = useLocalObservable(() => ({
    loadingMore: false,
    visibleCount: 0,
    isFetchingUnreadContents: false,
  }));
  const prevobjectTotal = usePrevious(activeGroupStore.objectTotal) || 0;

  const hasMore = state.visibleCount < activeGroupStore.objectTotal;

  const objects = React.useMemo(() => {
    return activeGroupStore.objects.slice(0, state.visibleCount);
  }, [activeGroupStore, state.visibleCount]);

  React.useEffect(() => {
    if (prevobjectTotal > 0) {
      state.visibleCount += activeGroupStore.objectTotal - prevobjectTotal;
    }
  }, [activeGroupStore.objectTotal]);

  const infiniteRef: any = useInfiniteScroll({
    loading: state.loadingMore,
    hasNextPage: hasMore,
    scrollContainer: 'parent',
    threshold: 200,
    onLoadMore: async () => {
      if (state.loadingMore || state.isFetchingUnreadContents) {
        return;
      }
      state.loadingMore = true;
      state.visibleCount = Math.min(
        state.visibleCount + 20,
        activeGroupStore.objectTotal
      );
      await sleep(200);
      state.loadingMore = false;
    },
  });

  return (
    <div ref={infiniteRef}>
      {objects.map((object: IObjectItem) => (
        <div key={object.TrxId}>
          <Fade in={true} timeout={250}>
            <div>
              {activeGroupStore.latestObjectTimeStampSet.has(
                object.TimeStamp
              ) &&
                activeGroupStore.isFilterAll && (
                  <div className="w-full text-12 text-center py-6 pb-3 text-gray-400">
                    上次看到这里
                  </div>
                )}
              <div className="cursor-pointer">
                <ObjectItem object={object} />
              </div>
            </div>
          </Fade>
        </div>
      ))}
      {!state.loadingMore && !hasMore && objects.length > 5 && (
        <div className="pt-6 pb-5 text-center text-12 text-gray-400 opacity-80">
          没有更多内容了哦
        </div>
      )}
    </div>
  );
});
