import React from 'react';
import { createRoot } from 'react-dom/client';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider, useStore } from 'store';
import { ThemeRoot } from 'utils/theme';
import useSubmitPost, { ISubmitObjectPayload } from 'hooks/useSubmitPost';
import Editor from 'components/Editor';
import { lang } from 'utils/lang';
import Avatar from 'components/Avatar';
import { toJS } from 'mobx';
import * as MainScrollView from 'utils/mainScrollView';
import sleep from 'utils/sleep';
import Dialog from 'components/Dialog';
import { IDBPost } from 'hooks/useDatabase/models/posts';

export default (object?: IDBPost) => {
  const div = document.createElement('div');
  document.body.append(div);
  const root = createRoot(div);
  const unmount = () => {
    root.unmount();
    div.remove();
  };
  root.render(
    <ThemeRoot>
      <StoreProvider>
        <ObjectEditor
          object={object}
          rs={() => {
            setTimeout(unmount, 100);
          }}
        />
      </StoreProvider>
    </ThemeRoot>,
  );
};

const ObjectEditor = observer((props: {
  object?: IDBPost
  rs: () => unknown
}) => {
  const { activeGroupStore } = useStore();
  const submitPost = useSubmitPost();
  const state = useLocalObservable(() => ({
    open: true,
    profile: toJS(activeGroupStore.profile),
  }));

  const submit = async (payload: ISubmitObjectPayload) => {
    try {
      await submitPost(payload, {
        delayForUpdateStore: MainScrollView.scrollTop() > 0 ? 400 : 150,
      });
      setTimeout(async () => {
        close();
        await sleep(50);
        MainScrollView.scrollToTop();
      }, 0);
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
      transitionDuration={300}
    >
      <div className="w-[600px] box-border px-8 py-5">
        <div className="flex items-center pb-3">
          <Avatar
            className="cursor-pointer"
            avatar={state.profile.avatar}
            size={40}
          />
          <div
            className="cursor-pointer ml-3 text-16 text-gray-6f max-w-60 truncate"
          >{state.profile.name}</div>
        </div>
        <div className="bg-white box-border" data-test-id="timeline-new-post-input">
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
      </div>
    </Dialog>
  );
});
