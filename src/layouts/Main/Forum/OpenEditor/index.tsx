import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalStore } from 'mobx-react-lite';
import { StoreProvider, useStore } from 'store';
import { TextField } from '@material-ui/core';
import EditorJs from './EditorJs';
import Button from 'components/Button';
import useHasPermission from 'store/selectors/useHasPermission';
import useSubmitObject from 'hooks/useSubmitObject';
import { debounce } from 'lodash';
import MainModal from 'components/MainModal';
import useGroupChange from 'hooks/useGroupChange';

export default () => {
  const div = document.createElement('div');
  document.body.append(div);
  const unmount = () => {
    unmountComponentAtNode(div);
    div.remove();
  };
  render(
    (
      <StoreProvider>
        <ForumEditor
          rs={() => {
            setTimeout(unmount, 100);
          }}
        />
      </StoreProvider>
    ),
    div,
  );
};

const ForumEditor = observer((props: {
  rs: () => unknown
}) => {
  const { snackbarStore, activeGroupStore } = useStore();
  const draftTitleKey = `FORUM_OBJECT_DRAFT_TITLE_${activeGroupStore.id}`;
  const draftContentKey = `FORUM_OBJECT_DRAFT_CONTENT_${activeGroupStore.id}`;
  const state = useLocalStore(() => ({
    loading: false,
    open: true,
    title: localStorage.getItem(draftTitleKey) || '',
    content: localStorage.getItem(draftContentKey) || '',
  }));
  const hasPermission = useHasPermission();
  const submitObject = useSubmitObject();

  const saveDraft = React.useCallback(
    debounce((title: string, content: string) => {
      localStorage.setItem(draftTitleKey, title);
      localStorage.setItem(draftContentKey, content);
    }, 500),
    [],
  );

  const submit = async () => {
    if (!hasPermission) {
      snackbarStore.show({
        message: '群组管理员已禁止你发布内容',
        type: 'error',
        duration: 2500,
      });
      return;
    }
    state.loading = true;
    await submitObject({
      name: state.title,
      content: state.content,
    });
    localStorage.removeItem(draftTitleKey);
    localStorage.removeItem(draftContentKey);
    state.loading = false;
    close();
  };

  const close = () => {
    state.open = false;
    props.rs();
  };

  useGroupChange(close);

  return (
    <MainModal open={state.open} onClose={close}>
      <div>
        <TextField
          className="pt-6 post-editor-input pb-1 relative"
          autoFocus={!state.title}
          fullWidth
          required
          placeholder="请输入标题"
          value={state.title}
          onChange={(e) => {
            state.title = e.target.value.trim();
            saveDraft(state.title, state.content);
          }}
          inputProps={{
            maxLength: 50,
          }}
        />
        <EditorJs
          data={state.content ? JSON.parse(state.content) : null}
          onChange={(data: string) => {
            state.content = data;
            saveDraft(state.title, state.content);
          }}
        />
        <div className="absolute top-[32px] right-[10px] z-50 mr-6">
          <Button disabled={!state.title || !state.content || JSON.parse(state.content).blocks.length === 0} onClick={submit} isDoing={state.loading}>
            发布
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
    </MainModal>
  );
});
