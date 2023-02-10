import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider, useStore } from 'store';
import { TextField } from '@material-ui/core';
import Button from 'components/Button';
import useHasPermission from 'store/selectors/useHasPermission';
import useSubmitObject from 'hooks/useSubmitObject';
import { debounce } from 'lodash';
import MainModal from 'components/MainModal';
import useGroupChange from 'hooks/useGroupChange';
import { ThemeRoot } from 'utils/theme';
import useGroupStatusCheck from 'hooks/useGroupStatusCheck';
import { lang } from 'utils/lang';
import { MDEditor } from './MDEditor';

const editors: Array<() => unknown> = [];

export const closeAllEditor = () => {
  editors.forEach((v) => v());
};

export default () => {
  const div = document.createElement('div');
  document.body.append(div);
  const unmount = () => {
    const index = editors.indexOf(unmount);
    if (index !== -1) {
      editors.splice(index, 1);
    }
    unmountComponentAtNode(div);
    div.remove();
  };
  editors.push(unmount);
  render(
    (
      <ThemeRoot>
        <StoreProvider>
          <ForumEditor
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
  rs: () => unknown
}) => {
  const { snackbarStore, activeGroupStore } = useStore();
  const draftTitleKey = `FORUM_OBJECT_DRAFT_TITLE_${activeGroupStore.id}`;
  const draftContentKey = `FORUM_OBJECT_DRAFT_CONTENT_${activeGroupStore.id}`;
  const state = useLocalObservable(() => ({
    loading: false,
    open: true,
    title: localStorage.getItem(draftTitleKey) || '',
    content: localStorage.getItem(draftContentKey) || '',
    get canSubmit() {
      return !!state.title.trim() && !!state.content;
    },
  }));
  const hasPermission = useHasPermission();
  const submitObject = useSubmitObject();
  const groupStatusCheck = useGroupStatusCheck();

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
        message: lang.beBannedTip,
        type: 'error',
        duration: 2500,
      });
      return;
    }
    if (!groupStatusCheck(activeGroupStore.id)) {
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
            saveDraft(state.title.trim(), state.content);
          }}
          inputProps={{
            maxLength: 50,
          }}
        />
        <MDEditor
          className="flex-1 mt-4 mb-10 h-0"
          value={state.content ?? ''}
          onChange={(data: string) => {
            state.content = data;
            saveDraft(state.title, state.content);
          }}
        />
        <div className="absolute top-[32px] right-[10px] z-50 mr-6">
          <Button disabled={!state.canSubmit} onClick={submit} isDoing={state.loading}>
            {lang.publish}
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
