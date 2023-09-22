import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider, useStore } from 'store';
import { ThemeRoot } from 'utils/theme';
import useSubmitObject, { ISubmitObjectPayload } from 'hooks/useSubmitObject';
import Editor from 'components/Editor';
import { lang } from 'utils/lang';
import Avatar from 'components/Avatar';
import { toJS } from 'mobx';
import * as MainScrollView from 'utils/mainScrollView';
import sleep from 'utils/sleep';
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
  const { activeGroupStore } = useStore();
  const submitObject = useSubmitObject();
  const state = useLocalObservable(() => ({
    open: true,
    profile: toJS(activeGroupStore.profile),
  }));

  const submit = async (payload: ISubmitObjectPayload) => {
    try {
      await submitObject(payload, {
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
      transitionDuration={{
        enter: 300,
      }}
    >
      <div className="w-[600px] box-border px-8 py-5">
        <div className="flex items-center pb-3">
          <Avatar
            className="cursor-pointer"
            url={state.profile.avatar}
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
