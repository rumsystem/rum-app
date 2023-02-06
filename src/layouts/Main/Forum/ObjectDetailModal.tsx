import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import * as PostModel from 'hooks/useDatabase/models/posts';
import Dialog from 'components/Dialog';
import Comment from './Comment';
import useGroupChange from 'hooks/useGroupChange';
import useDatabase from 'hooks/useDatabase';
import { useStore } from 'store';
import ObjectItem from './ObjectItem';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { lang } from 'utils/lang';

const PostDetail = observer(() => {
  const { modalStore, activeGroupStore } = useStore();
  const { objectId, selectedCommentOptions, scrollToComments } = modalStore.forumObjectDetail.data;
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
        const object = await PostModel.get(database, {
          groupId: activeGroupStore.id,
          id: objectId,
          currentPublisher: activeGroup.user_pubkey,
        });
        if (object) {
          activeGroupStore.addPostToMap(objectId, object);
        }
      } catch (err) {
        console.error(err);
      }
      state.isFetched = true;
    })();
  }, []);

  const object = activeGroupStore.postMap[objectId];

  if (!state.isFetched) {
    return null;
  }

  return (
    <div className="bg-white rounded-0 pt-2 pb-3 box-border h-[85vh] overflow-y-auto">
      <div className="w-[700px]">
        {!!object && (<>
          <ObjectItem
            post={object}
            inObjectDetailModal
          />
          <div className="flex flex-col justify-end grow">
            <div>
              <Comment
                post={object}
                inObjectDetailModal
                selectedCommentOptions={selectedCommentOptions}
                showInTop={scrollToComments}
              />
            </div>
          </div>
        </>)}
        {!object && (
          <div className="py-32 text-center text-14 text-gray-400 opacity-80">
            {lang.notFound2(lang.object)}
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
