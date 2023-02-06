import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import classNames from 'classnames';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider, useStore } from 'store';
import { IDBPost } from 'hooks/useDatabase/models/posts';
import Dialog from 'components/Dialog';
import useGroupChange from 'hooks/useGroupChange';
import { ThemeRoot } from 'utils/theme';
import Base64 from 'utils/base64';
import openPhotoSwipe from 'standaloneModals/openPhotoSwipe';
import { replaceSeedAsButton } from 'utils/replaceSeedAsButton';

interface IProps {
  object: IDBPost
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
  images: Exclude<IDBPost['images'], undefined>
}) => (
  <div className="flex">
    {props.images.map((item, index) => {
      const url = Base64.getUrl(item);
      const onClick = () => {
        openPhotoSwipe({
          image: props.images.map((image) => Base64.getUrl(image)),
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
          >
            <img className="w-full h-full opacity-0" src={url} alt="" />
          </div>
        </div>
      );
    })}
  </div>
);

const PostDetail = observer((props: {
  rs: () => unknown
  object: IDBPost
}) => {
  const state = useLocalObservable(() => ({
    open: true,
    objectRef: null as null | HTMLDivElement,
  }));
  const { object } = props;
  const { content, images } = object;

  const { fontStore } = useStore();

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
    <Dialog
      maxWidth="xl"
      hideCloseButton
      open={state.open}
      onClose={close}
      transitionDuration={{
        enter: 300,
      }}
    >
      <div className="bg-white rounded-0 py-2 pr-2 pl-[2px] pb-0 box-border h-[85vh] overflow-y-auto">
        <div className="w-[650px]">
          <div className="p-10">
            <div
              className={classNames(
                'text-gray-4a break-all whitespace-pre-wrap tracking-wider post-content',
              )}
              style={{
                fontSize: `${fontStore.fontSize}px`,
              }}
              dangerouslySetInnerHTML={{
                __html: content,
              }}
              ref={(ref) => {
                if (!state.objectRef) {
                  state.objectRef = ref;
                }
              }}
            />
            {images && (
              <div>
                {content && <div className="pt-[14px]" />}
                {!content && <div className="pt-2" />}
                <Images images={images} />
              </div>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
});
