import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider } from 'store';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import MainModal from 'components/MainModal';
import useGroupChange from 'hooks/useGroupChange';
import { ThemeRoot } from 'utils/theme';
import { IImage } from 'apis/content';
import Base64 from 'utils/base64';
import openPhotoSwipe from 'standaloneModals/openPhotoSwipe';
import { replaceSeedAsButton } from 'utils/replaceSeedAsButton';

interface IProps {
  object: IDbDerivedObjectItem
}

export default (props: IProps) => {
  const div = document.createElement('div');
  document.body.append(div);
  const unmount = () => {
    unmountComponentAtNode(div);
    div.remove();
  };
  render(
    (
      <ThemeRoot>
        <StoreProvider>
          <PostDetail
            object={props.object}
            rs={() => {
              setTimeout(unmount, 500);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
};

const Images = (props: {
  images: IImage[]
}) => (
  <div className="flex">
    {props.images.map((item: IImage, index: number) => {
      const url = Base64.getUrl(item);
      const onClick = () => {
        openPhotoSwipe({
          image: props.images.map((image: IImage) => Base64.getUrl(image)),
          index,
        });
      };
      return (
        <div key={index}>
          <div
            className="w-26 h-26 rounded-10 mr-3"
            style={{
              background: `url(${url}) center center / cover no-repeat rgba(64, 64, 64, 0.6)`,
            }}
            onClick={onClick}
          />
        </div>
      );
    })}
  </div>
);

const PostDetail = observer((props: {
  rs: () => unknown
  object: IDbDerivedObjectItem
}) => {
  const state = useLocalObservable(() => ({
    open: true,
    objectRef: null as null | HTMLDivElement,
  }));
  const { object } = props;
  const { content, image } = object.Content;

  const close = () => {
    state.open = false;
    props.rs();
  };

  React.useEffect(() => {
    if (state.objectRef) {
      replaceSeedAsButton(state.objectRef);
    }
  }, [state.objectRef]);

  useGroupChange(close);

  return (
    <MainModal open={state.open} onClose={close}>
      <div className="py-2 px-1 pb-8">
        <div
          className='text-gray-4a break-all whitespace-pre-wrap tracking-wider post-content'
          dangerouslySetInnerHTML={{
            __html: content,
          }}
          ref={(ref) => {
            if (!state.objectRef) {
              state.objectRef = ref;
            }
          }}
        />
        {image && <div>
          {content && <div className="pt-[14px]" />}
          {!content && <div className="pt-2" />}
          <Images images={image} />
        </div>}
      </div>
    </MainModal>
  );
});
