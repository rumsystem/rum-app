import React from 'react';
import { observer } from 'mobx-react-lite';
import ObjectItem from './ObjectItem';
import { useStore } from 'store';
import Fade from '@material-ui/core/Fade';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import { ObjectsFilterType } from 'store/activeGroup';

export default observer(() => {
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
                  上次看到这里
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
