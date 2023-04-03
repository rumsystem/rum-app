import React from 'react';
import { observer } from 'mobx-react-lite';
import useSubmitPost, { ISubmitObjectPayload } from 'hooks/useSubmitPost';
import Editor from 'components/Editor';
import { lang } from 'utils/lang';

export default observer(() => {
  const submitPost = useSubmitPost();

  const submit = async (payload: ISubmitObjectPayload) => {
    try {
      await submitPost(payload);
      return true;
    } catch (_) {
      return false;
    }
  };

  return (
    <div className="bg-white mb-[10px] pt-5 pb-4 px-6 box-border border border-gray-f2" data-test-id="note-editor">
      <Editor
        editorKey="object"
        placeholder={lang.andNewIdea}
        minRows={2}
        submit={submit}
        enabledImage
      />
    </div>
  );
});
