import React from 'react';
import { observer } from 'mobx-react-lite';
import { Fade } from '@mui/material';
import ObjectToolbar from './ObjectToolbar';
import Profile from '../Profile';
import { useStore } from 'store';
import Button from 'components/Button';
import { ObjectsFilterType } from 'store/activeGroup';
import useActiveGroupLatestStatus from 'store/selectors/useActiveGroupLatestStatus';
import { IDBPost } from 'hooks/useDatabase/models/posts';
import ObjectItem from './ObjectItem';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { lang } from 'utils/lang';
import ObjectDetailModal from './ObjectDetailModal';
import * as PostModel from 'hooks/useDatabase/models/posts';

interface Props {
  loadingMore: boolean
  isFetchingUnreadObjects: boolean
  fetchUnreadObjects: () => void
  newObjectButtonDisabled: boolean
  historicalObjectsLabelId: string
}

export default observer((props: Props) => {
  const { activeGroupStore } = useStore();
  const { objectsFilter } = activeGroupStore;
  const { unreadCount } = useActiveGroupLatestStatus();
  const activeGroup = useActiveGroup();
  const showNewObjectButton = !props.newObjectButtonDisabled && unreadCount > 0;

  return (
    <div className="lg:w-[700px] mx-auto" data-test-id="post-feed">
      <div className='box-border px-5 lg:px-0'>
        <Fade in={true} timeout={350}>
          <div>
            {objectsFilter.type === ObjectsFilterType.ALL && !activeGroupStore.searchText && <ObjectToolbar />}
            {objectsFilter.type === ObjectsFilterType.SOMEONE && (
              <Profile publisher={objectsFilter.publisher || ''} />
            )}
          </div>
        </Fade>

        {objectsFilter.type === ObjectsFilterType.ALL && showNewObjectButton && (
          <div className="relative w-full">
            <div className="flex justify-center absolute left-0 w-full -top-2 z-10">
              <Fade in={true} timeout={350}>
                <div>
                  <Button className="shadow-xl" onClick={props.fetchUnreadObjects}>
                    {lang.getNewObject}
                    {props.isFetchingUnreadObjects ? ' ...' : ''}
                  </Button>
                </div>
              </Fade>
            </div>
          </div>
        )}

        {activeGroupStore.objectTotal === 0
          && !activeGroupStore.searchText
          && objectsFilter.type === ObjectsFilterType.SOMEONE && (
          <Fade in={true} timeout={350}>
            <div className="pt-16 text-center text-14 text-gray-400 opacity-80">
              {objectsFilter.type === ObjectsFilterType.SOMEONE
                  && objectsFilter.publisher === activeGroup.user_pubkey
                  && lang.createFirstOne(lang.forumPost)}
            </div>
          </Fade>
        )}
      </div>

      <div className="w-full box-border px-5 lg:px-0">
        <div className="pb-4">
          {activeGroupStore.objects.map((object: IDBPost) => (
            <div key={object.id}>
              <div>
                {activeGroupStore.latestPostTimeStampSet.has(
                  object.timestamp,
                )
                && objectsFilter.type === ObjectsFilterType.ALL
                && objectsFilter.order === PostModel.Order.desc
                && !activeGroupStore.searchText
              && (
                <div className="w-full text-12 text-center py-3 text-gray-400">
                  {lang.lastReadHere}
                </div>
              )}
                <ObjectItem
                  post={object}
                  withBorder
                  disabledUserCardTooltip={
                    objectsFilter.type === ObjectsFilterType.SOMEONE
                  }
                  smallMDTitleFontsize
                />
                {object.id === activeGroupStore.firstFrontHistoricalObjectId && (
                  <div className="w-full text-12 text-gray-400 h-14 flex flex-center" id={props.historicalObjectsLabelId}>{lang.historicalObjects}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        {props.loadingMore && (
          <div className="pt-3 pb-6 text-center text-12 text-gray-400 opacity-80">
            {lang.loading} ...
          </div>
        )}
        {!props.loadingMore
          && !activeGroupStore.hasMorePosts
          && activeGroupStore.objectTotal > 5 && (
          <div className="pt-2 pb-6 text-center text-12 text-gray-400 opacity-80">
            {lang.noMore(lang.object)}
          </div>
        )}
      </div>

      {activeGroupStore.objectTotal === 0
        && activeGroupStore.searchText && (
        <Fade in={true} timeout={350}>
          <div className="pt-32 text-center text-14 text-gray-400 opacity-80">
            {lang.emptySearchResult}
          </div>
        </Fade>
      )}

      <ObjectDetailModal />
    </div>
  );
});
