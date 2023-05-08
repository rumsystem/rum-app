import { useEffect, ComponentProps } from 'react';
import classNames from 'classnames';
import { observable, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { Button } from '@mui/material';
import { store } from 'store';
import { IDBPost } from 'hooks/useDatabase/models/posts';
import { PostModel } from 'hooks/useDatabase/models';
import useDatabase from 'hooks/useDatabase';
import { Avatar } from 'components';
import { base64, ago } from 'utils';

type ButtonProps = ComponentProps<typeof Button>;
export interface Props extends ButtonProps {
  groupId: string
  postId: string
  compact?: boolean
}

export const ForwardPost = observer((props: Props) => {
  const { modalStore } = store;
  const state = useLocalObservable(() => observable({
    post: null as null | IDBPost,
  }, {}, { deep: false }));

  const loadPost = async () => {
    const groupId = props.groupId;
    const postId = props.postId;
    const post = store.activeGroupStore.posts.find((v) => v.groupId === groupId && v.id === postId);
    if (post) {
      runInAction(() => {
        state.post = post;
      });
    } else {
      const post = await PostModel.get(useDatabase(), { groupId, id: postId });
      if (post && store.activeGroupStore.id === props.groupId) {
        store.activeGroupStore.addPostToMap(post.id, post);
        runInAction(() => {
          state.post = post;
        });
      }
    }
  };

  useEffect(() => {
    loadPost();
  }, [props.groupId, props.postId]);

  if (!state.post) { return null; }
  const profile = store.activeGroupStore.profileMap[state.post.publisher] || state.post.extra.user;
  const firstImage = state.post?.images?.at(0);
  const firstImageUrl = firstImage
    ? 'url' in firstImage ? firstImage.url : base64.getUrl(firstImage)
    : '';

  const { groupId, postId, className, compact, ...rest } = props;
  return (
    <Button
      className={classNames(
        'flex-col items-start break-all border border-solid border-black/10 rounded-12',
        'font-normal !font-default normal-case tracking-normal w-full text-start',
        !compact && 'p-3 gap-[6px]',
        compact && 'py-[6px] px-2 gap-[3px]',
        props.className,
      )}
      onClick={() => modalStore.objectDetail.show({ postId: props.postId })}
      {...rest}
    >
      <div className="flex items-center gap-2">
        <Avatar avatar={profile.avatar} size={24} />
        <div>
          <span className={classNames('text-gray-4a font-bold', compact && 'text-12')}>
            {profile.name}
          </span>
          <span className="text-gray-88 text-12 ml-2">
            {ago(state.post.timestamp)}
          </span>
        </div>
      </div>
      <div className="flex gap-3 self-stretch">
        {!!firstImageUrl && (
          <div
            className="h-[84px] w-[84px] bg-cover rounded-12"
            style={{ backgroundImage: `url("${firstImageUrl}")` }}
          />
        )}
        <div className="flex-1 w-0">
          <div
            className={classNames(
              'truncate-4 leading-normal whitespace-pre-wrap break-all text-gray-4a',
              compact && 'text-12',
            )}
          >
            {state.post.content}
          </div>
        </div>
      </div>
    </Button>
  );
});
