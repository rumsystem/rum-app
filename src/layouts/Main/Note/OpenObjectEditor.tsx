import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import useSubmitObject, { ISubmitObjectPayload } from 'hooks/useSubmitObject';
import Editor from 'components/Editor';
import { lang } from 'utils/lang';
import Dialog from 'components/Dialog';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';

export default (object?: IDbDerivedObjectItem) => {
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
  object?: IDbDerivedObjectItem
  rs: () => unknown
}) => {
  const submitObject = useSubmitObject();
  const state = useLocalObservable(() => ({
    open: true,
  }));

  const submit = async (payload: ISubmitObjectPayload) => {
    try {
      await submitObject(payload);
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
