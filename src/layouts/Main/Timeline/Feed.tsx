import React from 'react';
import { observer } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import ObjectEditor from '../ObjectEditor';
import Profile from '../Profile';
import { useStore } from 'store';
import Button from 'components/Button';
import { ObjectsFilterType } from 'store/activeGroup';
import useActiveGroupLatestStatus from 'store/selectors/useActiveGroupLatestStatus';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import ObjectItem from './ObjectItem';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { lang } from 'utils/lang';

interface Props {
  loadingMore: boolean
  isFetchingUnreadObjects: boolean
  fetchUnreadObjects: () => void
}

export default observer((props: Props) => {
  const { activeGroupStore } = useStore();
  const { objectsFilter } = activeGroupStore;
  const { unreadCount } = useActiveGroupLatestStatus();
  const activeGroup = useActiveGroup();

  return (
    <div className="w-full lg:w-[600px] mx-auto">
      <div className='box-border px-5 lg:px-0'>
        <Fade in={true} timeout={350}>
          <div>
            {objectsFilter.type === ObjectsFilterType.ALL && <ObjectEditor />}
            {objectsFilter.type === ObjectsFilterType.SOMEONE && (
              <Profile publisher={objectsFilter.publisher || ''} />
            )}
          </div>
        </Fade>

        {objectsFilter.type === ObjectsFilterType.ALL && unreadCount > 0 && (
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
                  && lang.createFirstOne(lang.object)}
            </div>
          </Fade>
        )}
      </div>

      <div className="w-full box-border px-5 lg:px-0">
        <Objects />
        {props.loadingMore && (
          <div className="pt-3 pb-6 text-center text-12 text-gray-400 opacity-80">
            {lang.loading} ...
          </div>
        )}
        {!props.loadingMore
          && !activeGroupStore.hasMoreObjects
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
    </div>
  );
});

const Objects = observer(() => {
  const { activeGroupStore } = useStore();
  const { objectsFilter } = activeGroupStore;

  return (
    <div className="pb-4">
      {activeGroupStore.objects.map((object: IDbDerivedObjectItem) => (
        <div key={object.TrxId}>
          <Fade in={true} timeout={300}>
            <div>
              {activeGroupStore.latestObjectTimeStampSet.has(
                object.TimeStamp,
              )
                && objectsFilter.type === ObjectsFilterType.ALL
                && !activeGroupStore.searchText && (
                <div className="w-full text-12 text-center py-3 text-gray-400">
                  {lang.lastReadHere}
                </div>
              )}
              <ObjectItem
                object={object}
                withBorder
                disabledUserCardTooltip={
                  objectsFilter.type === ObjectsFilterType.SOMEONE
                }
              />
            </div>
          </Fade>
        </div>
      ))}
    </div>
  );
});
