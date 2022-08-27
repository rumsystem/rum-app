import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import useCheckPermission from 'hooks/useCheckPermission';
import useSubmitObject, { ISubmitObjectPayload } from 'hooks/useSubmitObject';
import Editor from 'components/Editor';
import { lang } from 'utils/lang';
import useActiveGroup from 'store/selectors/useActiveGroup';

export default observer(() => {
  const { snackbarStore } = useStore();
  const checkPermission = useCheckPermission();
  const submitObject = useSubmitObject();
  const activeGroup = useActiveGroup();

  const submit = async (payload: ISubmitObjectPayload) => {
    if (!await checkPermission(activeGroup.group_id, activeGroup.user_pubkey, 'POST')) {
      snackbarStore.show({
        message: lang.beBannedTip,
        type: 'error',
        duration: 2500,
      });
      return;
    }
    await submitObject(payload);
    return true;
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
