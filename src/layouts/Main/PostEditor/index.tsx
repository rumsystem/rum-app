import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { TextField } from '@material-ui/core';
import EditorJs from './EditorJs';
import Button from 'components/Button';

export default observer(() => {
  const state = useLocalStore(() => ({
    title: '',
    content: '',
  }));

  const submit = () => {
    console.log(state.title, state.content);
  };

  return (
    <div className="absolute inset-0 bg-gray-f7 flex justify-center py-8">
      <div className="w-full box-border px-11 lg:w-[700px] bg-white rounded-sm overflow-y-auto">
        <TextField
          className="pt-6 post-editor-input pb-1 relative"
          autoFocus={!state.title}
          fullWidth
          required
          placeholder="请输入标题"
          value={state.title}
          onChange={(e) => {
            state.title = e.target.value.trim();
          }}
          inputProps={{
            maxLength: 50,
          }}
        />
        <EditorJs
          data={state.content ? JSON.parse(state.content) : null}
          onChange={(data: string) => {
            state.content = data;
          }}
        />
        <div className="absolute bottom-0 right-0 bg-gray-f7 p-8 z-10 mr-2">
          <Button disabled={!state.title || !state.content} onClick={submit}>
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
    </div>
  );
});
