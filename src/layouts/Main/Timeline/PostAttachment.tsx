import React from 'react';
import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import { IDBPost } from 'hooks/useDatabase/models/posts';
import { Video } from 'components/Video';

interface IProps {
  className?: string
  attachment: IDBPost['attachment']
}

export const PostAttachment = observer((props: IProps) => {
  const video = props.attachment?.find((v) => v.type === 'Video');

  if (!video) { return null; }

  const poster = video.id
    ? `https://storage.googleapis.com/static.press.one/feed/videos/${video.id.replace(/\.mp4$/, '.jpg')}`
    : '';
  const url = video.id
    ? `https://storage.googleapis.com/static.press.one/feed/videos/${video.id}`
    : video.url!;

  return (
    <div
      className={classNames(
        props.className,
      )}
    >
      <Video
        url={url}
        width={video.width}
        height={video.height}
        duration={video.duration}
        poster={poster}
      />
    </div>
  );
});
