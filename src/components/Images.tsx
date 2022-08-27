import React from 'react';
import { IImage } from 'apis/content';
import Base64 from 'utils/base64';
import classNames from 'classnames';
import openPhotoSwipe from 'standaloneModals/openPhotoSwipe';

export default (props: {
  images: IImage[]
  className?: string
}) => {
  const urls = props.images.map((image: IImage) => Base64.getUrl(image));
  return (
    <div className="flex">
      {urls.map((url: string, index: number) => (
        <div
          key={index}
          onClick={() => {
            openPhotoSwipe({
              image: urls,
              index,
            });
          }}
        >
          <div
            className={classNames({
              'w-15 h-15': !props.className,
            }, `rounded-10 mr-3 ${props.className}`)}
            style={{
              background: `url(${url}) center center / cover no-repeat rgba(64, 64, 64, 0.6)`,
            }}
          />
        </div>
      ))}
    </div>
  );
};
