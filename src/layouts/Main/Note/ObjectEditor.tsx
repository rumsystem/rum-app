import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import useHasPermission from 'store/selectors/useHasPermission';
import useSubmitObject, { ISubmitObjectPayload } from 'hooks/useSubmitObject';
import Editor from 'components/Editor';
import { lang } from 'utils/lang';

export default observer(() => {
  const { snackbarStore } = useStore();
  const hasPermission = useHasPermission();
  const submitObject = useSubmitObject();


  const submit = async (payload: ISubmitObjectPayload) => {
    if (!hasPermission) {
      snackbarStore.show({
        message: lang.beBannedTip,
        type: 'error',
        duration: 2500,
      });
      return;
    }
    await submitObject(payload);
  };

  return (
    <div className="bg-white mb-[10px] pt-5 pb-4 px-6 box-border border border-gray-f2">
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
