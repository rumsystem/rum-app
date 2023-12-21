import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import Dialog from 'components/Dialog';
import Comment from './Comment';
import useGroupChange from 'hooks/useGroupChange';
import useDatabase from 'hooks/useDatabase';
import { useStore } from 'store';
import ObjectItem from './ObjectItem';
import useActiveGroup from 'store/selectors/useActiveGroup';

const PostDetail = observer(() => {
  const { modalStore, activeGroupStore } = useStore();
  const { objectTrxId, selectedCommentOptions, scrollToComments } = modalStore.forumObjectDetail.data;
  const state = useLocalObservable(() => ({
    isFetched: false,
    objectRef: null as null | HTMLDivElement,
  }));
  const database = useDatabase();
  const activeGroup = useActiveGroup();

  const close = () => {
    modalStore.forumObjectDetail.hide();
  };

  useGroupChange(close);

  React.useEffect(() => {
    (async () => {
      try {
        const object = await ObjectModel.get(database, {
          TrxId: objectTrxId,
          currentPublisher: activeGroup.user_pubkey,
        });
        if (object) {
          activeGroupStore.addObjectToMap(objectTrxId, object);
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

  const object = activeGroupStore.objectMap[objectTrxId];

  return (
    <div className="bg-white rounded-0 pt-2 pb-3 box-border h-[85vh] overflow-y-auto">
      <div className="w-[650px]">
        <ObjectItem
          object={object}
          inObjectDetailModal
        />
        <div className="flex flex-col justify-end flex-grow">
          <div>
            <Comment
              object={object}
              inObjectDetailModal
              selectedCommentOptions={selectedCommentOptions}
              showInTop={scrollToComments}
            />
          </div>
        </div>
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
      open={modalStore.forumObjectDetail.open}
      onClose={() => modalStore.forumObjectDetail.hide()}
      transitionDuration={{
        enter: 300,
      }}
    >
      <PostDetail />
    </Dialog>
  );
});
