import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider, useStore } from 'store';
import { TextField } from '@material-ui/core';
import Button from 'components/Button';
import useSubmitPost from 'hooks/useSubmitPost';
import { debounce } from 'lodash';
import Dialog from 'components/Dialog';
import useGroupChange from 'hooks/useGroupChange';
import { ThemeRoot } from 'utils/theme';
import { lang } from 'utils/lang';
import { MDEditor } from '../MDEditor';
import { IDBPost } from 'hooks/useDatabase/models/posts';

export default (post?: IDBPost) => {
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
          <ForumEditor
            post={post}
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

const ForumEditor = observer((props: {
  post?: IDBPost
  rs: () => unknown
}) => {
  const { activeGroupStore } = useStore();
  const draftTitleKey = `FORUM_OBJECT_DRAFT_TITLE_${activeGroupStore.id}`;
  const draftContentKey = `FORUM_OBJECT_DRAFT_CONTENT_${activeGroupStore.id}`;
  const state = useLocalObservable(() => ({
    loading: false,
    open: true,
    title: (props.post ? props.post.name : localStorage.getItem(draftTitleKey)) || '',
    content: (props.post ? props.post.content : localStorage.getItem(draftContentKey)) || '',
    get canSubmit() {
      return !!state.title.trim() && !!state.content;
    },
  }));
  const submitPost = useSubmitPost();
  const isUpdating = !!props.post;

  React.useEffect(() => {
    if (isUpdating) {
      return;
    }
    saveDraft(state.title, state.content);
  }, [state.title, state.content]);

  const saveDraft = React.useCallback(
    debounce((title: string, content: string) => {
      localStorage.setItem(draftTitleKey, title);
      localStorage.setItem(draftContentKey, content);
    }, 500),
    [],
  );

  const submit = async () => {
    state.loading = true;
    try {
      if (props.post) {
        throw new Error('not implemented');
        // await updatePost({
        //   name: state.title.trim(),
        //   content: state.content,
        //   postId: props.post.id,
        // });
      } else {
        await submitPost({
          name: state.title.trim(),
          content: state.content,
        });
      }
      localStorage.removeItem(draftTitleKey);
      localStorage.removeItem(draftContentKey);
      state.loading = false;
      close();
      return true;
    } catch (_) {
      state.loading = false;
      return false;
    }
  };

  const close = () => {
    state.open = false;
    props.rs();
  };

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
      <div className="bg-white rounded-0 py-2 pr-2 pl-[2px] pb-0 box-border overflow-y-auto">
        <div className="w-[700px] px-10 flex flex-col h-[84vh]">
          <div className="flex-1 flex flex-col h-0">
            <TextField
              className="pt-6 post-editor-input pb-1 relative"
              autoFocus={!state.title}
              fullWidth
              required
              placeholder={lang.require(lang.title)}
              value={state.title}
              onChange={(e) => {
                state.title = e.target.value;
              }}
              inputProps={{
                maxLength: 50,
              }}
              data-test-id="forum-post-title-input"
            />
            <MDEditor
              className="flex-1 mt-4 mb-10 h-0"
              value={state.content ?? ''}
              onChange={(data: string) => {
                state.content = data;
              }}
            />
            <div className="absolute top-[40px] right-[50px] z-50">
              <Button
                disabled={!state.canSubmit}
                onClick={submit}
                isDoing={state.loading}
                size="small"
                data-test-id="forum-post-submit-button"
              >
                {isUpdating ? lang.update : lang.publish}
              </Button>
            </div>
          </div>
          <style jsx global>{`
          .post-editor-input .MuiInput-root {
            font-weight: 500;
          }
          .post-editor-input .MuiInput-root input {
              font-size: 24px !important;
            }
          .post-editor-input MuiInput-underline:after, .MuiInput-underline:before {
            display: none;
          }
        `}</style>
        </div>
      </div>
    </Dialog>
  );
});
