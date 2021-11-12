import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import useHasPermission from 'store/selectors/useHasPermission';
import useSubmitObject from 'hooks/useSubmitObject';
import { debounce } from 'lodash';
import Editor from 'components/Editor';
import { lang } from 'utils/lang';

export default observer(() => {
  const { snackbarStore, activeGroupStore } = useStore();
  const hasPermission = useHasPermission();
  const submitObject = useSubmitObject();
  const draftKey = `OBJECT_DRAFT_${activeGroupStore.id}`;

  const saveDraft = React.useCallback(
    debounce((content: string) => {
      localStorage.setItem(draftKey, content);
    }, 500),
    [],
  );

  const submit = async (content: string) => {
    if (!hasPermission) {
      snackbarStore.show({
        message: lang.beBannedTip,
        type: 'error',
        duration: 2500,
      });
      return;
    }
    await submitObject({
      content,
    });
    localStorage.removeItem(draftKey);
  };

  return (
    <div className="bg-white mb-[10px] pt-5 pb-4 px-6 box-border border border-gray-f2">
      <Editor
        value={localStorage.getItem(draftKey) || ''}
        placeholder={lang.andNewIdea}
        minRows={2}
        submit={submit}
        saveDraft={saveDraft}
      />
    </div>
  );
});
