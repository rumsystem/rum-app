import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import DOMPurify from 'dompurify';
import { StoreProvider } from 'store';
import { IDbDerivedObjectItem, get } from 'hooks/useDatabase/models/object';
import MainModal from 'components/MainModal';
import Comment, { ISelectedCommentOptions } from './Comment';
import useGroupChange from 'hooks/useGroupChange';
import useDatabase from 'hooks/useDatabase';
import { ThemeRoot } from 'utils/theme';
import { defaultRenderer } from 'utils/markdown';
import BFSReplace from 'utils/BFSReplace';

interface IProps {
  objectTrxId: string
  selectedCommentOptions?: ISelectedCommentOptions
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
            {...props}
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

const PostDetail = observer((props: {
  rs: () => unknown
  objectTrxId: string
  selectedCommentOptions?: ISelectedCommentOptions
}) => {
  const state = useLocalObservable(() => ({
    open: true,
    isFetched: false,
    object: null as IDbDerivedObjectItem | null,
  }));
  const objectRef = React.useRef<HTMLDivElement>(null);
  const database = useDatabase();
  const content = React.useMemo(() => {
    if (!state.object) {
      return '';
    }
    try {
      return DOMPurify.sanitize(defaultRenderer.render(state.object.Content.content));
    } catch (err) {
      return '';
    }
  }, [state.object]);

  const close = () => {
    state.open = false;
    props.rs();
  };

  useGroupChange(close);

  React.useEffect(() => {
    (async () => {
      try {
        const object = await get(database, {
          TrxId: props.objectTrxId,
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

  React.useEffect(() => {
    const box = objectRef.current;
    if (!box) { return; }
    BFSReplace(
      box,
      /(https?:\/\/[^\s]+)/g,
      (text: string) => {
        const link = document.createElement('a');
        link.href = text;
        link.className = 'text-blue-400';
        link.textContent = text;
        return link;
      },
    );
  }, [content]);

  return (
    <MainModal
      open={state.open}
      onClose={close}
      bottomElement={() =>
        state.object && (
          <div className="flex flex-col justify-end flex-grow -mx-11">
            <div className="bg-gray-f7">
              <Comment
                object={state.object}
                inObjectDetailModal
                selectedCommentOptions={props.selectedCommentOptions}
              />
            </div>
          </div>
        )}
    >
      {state.object && (
        <div className="py-1 px-1 pb-8">
          <h2 className="font-bold text-gray-700 text-22 tracking-wide">{state.object.Content.name}</h2>
          <div
            className='mt-5 text-gray-4a rendered-markdown'
            ref={objectRef}
            dangerouslySetInnerHTML={{
              __html: content,
            }}
          />
        </div>
      )}
    </MainModal>
  );
});
