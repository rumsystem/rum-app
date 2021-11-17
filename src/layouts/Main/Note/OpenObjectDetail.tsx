import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider } from 'store';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import MainModal from 'components/MainModal';
import useGroupChange from 'hooks/useGroupChange';
import { ThemeRoot } from 'utils/theme';

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

const PostDetail = observer((props: {
  rs: () => unknown
  object: IDbDerivedObjectItem
}) => {
  const state = useLocalObservable(() => ({
    open: true,
  }));
  const { object } = props;
  const content = object.Content.content;

  const close = () => {
    state.open = false;
    props.rs();
  };

  useGroupChange(close);

  return (
    <MainModal open={state.open} onClose={close}>
      <div className="py-2 px-1 pb-8">
        <div
          className='text-gray-4a break-all whitespace-pre-wrap tracking-wider post-content'
          dangerouslySetInnerHTML={{
            __html: content,
          }}
        />
      </div>
    </MainModal>
  );
});
