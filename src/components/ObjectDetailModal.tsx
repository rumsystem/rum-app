import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import ObjectItem from 'layouts/Main/Timeline/ObjectItem';
import { useStore } from 'store';
import useDatabase from 'hooks/useDatabase';
import { IDbDerivedObjectItem, get } from 'hooks/useDatabase/models/object';
import sleep from 'utils/sleep';
import { lang } from 'utils/lang';

const ObjectDetail = observer(() => {
  const { modalStore } = useStore();
  const database = useDatabase();
  const state = useLocalObservable(() => ({
    isFetched: false,
    object: null as IDbDerivedObjectItem | null,
  }));

  React.useEffect(() => {
    (async () => {
      try {
        const object = await get(database, {
          TrxId: modalStore.objectDetail.data.objectTrxId,
        });
        if (object) {
          state.object = object;
        }
      } catch (err) {
        console.error(err);
      }
      state.isFetched = true;
    })();
  }, []);

  if (!state.isFetched) {
    return null;
  }

  return (
    <div className="bg-white rounded-0 py-2 pr-2 pl-[2px] pb-0 box-border h-[85vh] overflow-y-auto">
      <div className="w-[600px]">
        {state.object && (
          <ObjectItem
            object={state.object}
            inObjectDetailModal
            beforeGoToUserPage={async () => {
              modalStore.objectDetail.hide();
              await sleep(400);
            }}
          />
        )}
        {!state.object && (
          <div className="py-32 text-center text-14 text-gray-400 opacity-80">
            {lang.notFound(lang.object)}
          </div>
        )}
      </div>
    </div>
  );
});

export default observer(() => {
  const { modalStore } = useStore();
  return (
    <Dialog
      maxWidth="xl"
      hideCloseButton
      open={modalStore.objectDetail.open}
      onClose={() => modalStore.objectDetail.hide()}
      transitionDuration={{
        enter: 300,
      }}
    >
      <ObjectDetail />
    </Dialog>
  );
});
