import React from 'react';
import { observer } from 'mobx-react-lite';
import useSubmitObject, { ISubmitObjectPayload } from 'hooks/useSubmitObject';
import Editor from 'components/Editor';
import { lang } from 'utils/lang';

export default observer(() => {
  const submitObject = useSubmitObject();

  const submit = async (payload: ISubmitObjectPayload) => {
    try {
      await submitObject(payload);
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
