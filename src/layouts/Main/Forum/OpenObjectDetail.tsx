import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider } from 'store';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import * as EditorJsParser from './editorJsParser';
import MainModal from 'components/MainModal';
import Comment from './Comment';

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
      <StoreProvider>
        <PostDetail
          object={props.object}
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
  object: IDbDerivedObjectItem
}) => {
  const state = useLocalObservable(() => ({
    open: true,
  }));
  const { object } = props;
  const content = React.useMemo(() => {
    try {
      return EditorJsParser.toHTML(JSON.parse(object.Content.content));
    } catch (err) {
      return '';
    }
  }, [object.Content.content]);

  const close = () => {
    state.open = false;
    props.rs();
  };

  return (
    <MainModal
      open={state.open}
      onClose={close}
      bottomElement={() =>
        (
          <div className="flex flex-col justify-end flex-grow -mx-11">
            <div className="bg-gray-f7">
              <Comment
                object={object}
                inObjectDetailModal
              />
            </div>
          </div>
        )}
    >
      <div className="py-1 px-1 pb-8">
        <h2 className="font-bold text-gray-700 text-22 leading-5 tracking-wide">{object.Content.name}</h2>
        <div
          className='mt-5 text-gray-4a break-all whitespace-pre-wrap tracking-wider post-content'
          dangerouslySetInnerHTML={{
            __html: content,
          }}
        />
      </div>
    </MainModal>
  );
});
