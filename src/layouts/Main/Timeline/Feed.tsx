import React from 'react';
import { runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import ObjectEditorEntry from './ObjectEditorEntry';
import Profile from '../Profile';
import { useStore } from 'store';
import Button from 'components/Button';
import { ObjectsFilterType } from 'store/activeGroup';
import useActiveGroupLatestStatus from 'store/selectors/useActiveGroupLatestStatus';
import ObjectDetailModal from './ObjectDetailModal';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import ObjectItem from './ObjectItem';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { lang } from 'utils/lang';

interface Props {
  loadingMore: boolean
  isFetchingUnreadObjects: boolean
  fetchUnreadObjects: () => void
  newObjectButtonDisabled: boolean
  historicalObjectsLabelId: string
}

export default observer((props: Props) => {
  const state = useLocalObservable(() => ({
    inview: true,
  }));
  const { activeGroupStore } = useStore();
  const { objectsFilter } = activeGroupStore;
  const { unreadCount } = useActiveGroupLatestStatus();
  const activeGroup = useActiveGroup();
  const showNewObjectButton = !props.newObjectButtonDisabled && objectsFilter.type === ObjectsFilterType.ALL && unreadCount > 0;

  const rootBox = React.useRef<HTMLDivElement>(null);
  const newObjectButtonBox = React.useRef<HTMLDivElement>(null);
  const newObjectButton = React.useRef<HTMLDivElement>(null);
  const newFloatObjectButton = React.useRef<HTMLDivElement>(null);

  const handleClickNewObjectButton = () => {
    if (newFloatObjectButton.current?.style.position === 'fixed') {
      if (!state.inview) {
        newObjectButton.current?.scrollIntoView({
          block: 'center',
        });
      }
    }
    props.fetchUnreadObjects();
  };

  React.useEffect(() => {
    const scrollBox = newObjectButtonBox.current?.offsetParent;
    if (!scrollBox) {
      return;
    }
    const offsetTop = newObjectButtonBox.current.offsetTop;
    const handleScroll = () => {
      runInAction(() => {
        state.inview = scrollBox.scrollTop <= offsetTop;
      });
      calcAndSetPosition();
    };
    scrollBox.addEventListener('scroll', handleScroll);
    const calcAndSetPosition = () => {
      const btn = newFloatObjectButton.current;
      if (!btn) {
        return;
      }
      if (!state.inview) {
        const rect = newObjectButton.current!.getBoundingClientRect();
        Object.assign(btn.style, {
          left: `${rect.left}px`,
          right: `${window.innerWidth - rect.right}px`,
          top: `${110}px`,
          bottom: `${window.innerHeight - 110 - rect.height}px`,
          position: 'fixed',
          display: '',
        });
      } else {
        Object.assign(btn.style, {
          left: '',
          right: '',
          top: '',
          bottom: '',
          position: '',
          display: 'none',
        });
      }
    };
    handleScroll();
    return () => {
      scrollBox.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      className="w-full lg:w-[600px] mx-auto"
      ref={rootBox}
      data-test-id="timeline-feed"
    >
      <div className='box-border px-5 lg:px-0'>
        <Fade in={true} timeout={350}>
          <div>
            {objectsFilter.type === ObjectsFilterType.ALL && <ObjectEditorEntry />}
            {objectsFilter.type === ObjectsFilterType.SOMEONE && (
              <Profile publisher={objectsFilter.publisher || ''} />
            )}
          </div>
        </Fade>

        {objectsFilter.type === ObjectsFilterType.ALL && (
          <div className="relative w-full" ref={newObjectButtonBox}>
            <div className="flex justify-center absolute left-0 w-full top-[-23px] z-10" ref={newObjectButton}>
              <Fade in={showNewObjectButton} timeout={350}>
                <div>
                  <Button className="shadow-xl" onClick={handleClickNewObjectButton} size="small">
                    {lang.getNewObject}
                    {props.isFetchingUnreadObjects ? ' ...' : ''}
                  </Button>
                </div>
              </Fade>
            </div>
            <div className="flex justify-center fixed z-10" ref={newFloatObjectButton}>
              <Fade in={showNewObjectButton} timeout={350}>
                <div>
                  <Button className="shadow-xl" onClick={handleClickNewObjectButton} size="small">
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
        <div className="pb-4">
          {activeGroupStore.objects.map((object: IDbDerivedObjectItem) => (
            <div key={object.TrxId}>
              <div>
                {activeGroupStore.latestObjectTimeStampSet.has(
                  object.TimeStamp,
                )
                    && objectsFilter.type === ObjectsFilterType.ALL
                    && !activeGroupStore.searchText && (<div className="w-full text-12 text-center py-3 text-gray-400">{lang.lastReadHere}</div>)}
                <ObjectItem
                  object={object}
                  withBorder
                  disabledUserCardTooltip={
                    objectsFilter.type === ObjectsFilterType.SOMEONE
                  }
                />
                {object.TrxId === activeGroupStore.firstFrontHistoricalObjectTrxId && (
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

      {activeGroupStore.objectTotal === 0
        && !activeGroupStore.searchText && objectsFilter.type === ObjectsFilterType.ALL && (
        <Fade in={true} timeout={350}>
          <div className="pt-32 text-center text-14 text-gray-400 opacity-80">
            {lang.publishFirstTimeline}
          </div>
        </Fade>
      )}

      <ObjectDetailModal />
    </div>
  );
});
