import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import useSubmitPost, { ISubmitObjectPayload } from 'hooks/useSubmitPost';
import Editor from 'components/Editor';
import { lang } from 'utils/lang';
import Dialog from 'components/Dialog';
import { IDBPost } from 'hooks/useDatabase/models/posts';

export default (object?: IDBPost) => {
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
          <ObjectEditor
            object={object}
            rs={() => {
              setTimeout(unmount, 100);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
};

const ObjectEditor = observer((props: {
  object?: IDBPost
  rs: () => unknown
}) => {
  const submitPost = useSubmitPost();
  const state = useLocalObservable(() => ({
    open: true,
  }));

  const submit = async (payload: ISubmitObjectPayload) => {
    try {
      await submitPost(payload);
      close();
      return true;
    } catch (_) {
      return false;
    }
  };

  const close = () => {
    state.open = false;
    props.rs();
  };

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
      <div className="w-[600px] box-border px-8 py-5">
        <Editor
          object={props.object}
          editorKey="object"
          placeholder={lang.andNewIdea}
          autoFocus
          minRows={3}
          submit={submit}
          enabledImage
        />
      </div>
    </Dialog>
  );
});
