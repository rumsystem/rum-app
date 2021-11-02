import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider } from 'store';
import { IDbDerivedObjectItem, get } from 'hooks/useDatabase/models/object';
import * as EditorJsParser from './editorJsParser';
import MainModal from 'components/MainModal';
import Comment, { ISelectedCommentOptions } from './Comment';
import useGroupChange from 'hooks/useGroupChange';
import useDatabase from 'hooks/useDatabase';

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
      <StoreProvider>
        <PostDetail
          {...props}
          rs={() => {
            setTimeout(unmount, 500);
          }}
        />
      </StoreProvider>
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
  const database = useDatabase();
  const content = React.useMemo(() => {
    if (!state.object) {
      return '';
    }
    try {
      return EditorJsParser.toHTML(JSON.parse(state.object.Content.content));
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
          <h2 className="font-bold text-gray-700 text-22 leading-5 tracking-wide">{state.object.Content.name}</h2>
          <div
            className='mt-5 text-gray-4a break-all whitespace-pre-wrap tracking-wider post-content'
            dangerouslySetInnerHTML={{
              __html: content,
            }}
          />
        </div>
      )}
    </MainModal>
  );
});
