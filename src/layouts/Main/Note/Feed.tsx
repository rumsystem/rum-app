import React from 'react';
import { observer } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import ObjectEditor from '../ObjectEditor';
import { useStore } from 'store';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import ObjectItem from './ObjectItem';
import classNames from 'classnames';
import { lang } from 'utils/lang';

interface Props {
  loadingMore: boolean
  isFetchingUnreadObjects: boolean
  fetchUnreadObjects: () => void
}

export default observer((props: Props) => {
  const { activeGroupStore } = useStore();

  return (
    <div>
      <div className='mx-auto lg:w-[600px] w-full box-border px-5 lg:px-0'>
        <Fade in={true} timeout={350}>
          <div>
            <ObjectEditor />
          </div>
        </Fade>
      </div>

      {activeGroupStore.objectTotal === 0 && !activeGroupStore.searchText && (
        <div className="text-gray-88 text-16 pt-32 text-center tracking-wider">
          {lang.createFirstOne(lang.note)}
        </div>
      )}

      <div className={classNames({
        'bg-white': activeGroupStore.objectTotal > 0,
      }, 'p-8 mt-7 min-h-80-vh')}
      >
        {activeGroupStore.objectTotal > 0 && (
          <Objects />
        )}
        {!props.loadingMore
          && !activeGroupStore.hasMoreObjects
          && activeGroupStore.objectTotal > 12 && (
          <div className="pt-10 pb-6 text-center text-12 text-gray-400 opacity-80">
            {lang.noMore(lang.note)}
          </div>
        )}
        {props.loadingMore && (
          <div className="pt-3 pb-6 text-center text-12 text-gray-400 opacity-80">
            {lang.loading} ...
          </div>
        )}
        {activeGroupStore.objectTotal === 0
          && activeGroupStore.searchText && (
          <Fade in={true} timeout={350}>
            <div className="pt-32 text-center text-14 text-gray-400 opacity-80">
              {lang.emptySearchResult}
            </div>
          </Fade>
        )}
      </div>
    </div>
  );
});

const Objects = observer(() => {
  const { activeGroupStore } = useStore();

  return (
    <div>
      <div className="grid grid-cols-4 gap-5">
        {activeGroupStore.objects.map((object: IDbDerivedObjectItem) => (
          <div key={object.TrxId}>
            <Fade in={true} timeout={300}>
              <div>
                <ObjectItem object={object} />
              </div>
            </Fade>
          </div>
        ))}
      </div>
    </div>
  );
});
