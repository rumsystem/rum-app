import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import ObjectItem from './ObjectItem';
import { useStore } from 'store';
import useInfiniteScroll from 'react-infinite-scroll-hook';
import Fade from '@material-ui/core/Fade';
import { IDbDerivedObjectItem } from 'store/database';
import { queryObjectsFrom } from 'store/database/selectors/object';
import { sleep } from 'utils';

const OBJECTS_LIMIT = 20;

export default observer(() => {
  const { activeGroupStore } = useStore();
  const state = useLocalObservable(() => ({
    loadingMore: false,
  }));

  const infiniteRef: any = useInfiniteScroll({
    loading: state.loadingMore,
    hasNextPage:
      activeGroupStore.objectTotal > 0 && activeGroupStore.hasMoreObjects,
    scrollContainer: 'parent',
    threshold: 200,
    onLoadMore: async () => {
      if (state.loadingMore) {
        return;
      }
      state.loadingMore = true;
      const objects = await queryObjectsFrom({
        GroupId: activeGroupStore.id,
        limit: OBJECTS_LIMIT,
        Timestamp: activeGroupStore.rearObject.TimeStamp,
      });
      if (objects.length < OBJECTS_LIMIT) {
        activeGroupStore.setHasMoreObjects(false);
      }
      console.log({ objects });
      for (const object of objects) {
        activeGroupStore.addObject(object);
      }
      await sleep(500);
      state.loadingMore = false;
    },
  });

  return (
    <div ref={infiniteRef}>
      {activeGroupStore.objects.map((object: IDbDerivedObjectItem) => (
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
      {state.loadingMore && (
        <div className="py-6 text-center text-12 text-gray-400 opacity-80">
          加载中 ...
        </div>
      )}
      {!state.loadingMore &&
        !activeGroupStore.hasMoreObjects &&
        activeGroupStore.objects.length > 5 && (
          <div className="py-6 text-center text-12 text-gray-400 opacity-80">
            没有更多内容了哦
          </div>
        )}
    </div>
  );
});
