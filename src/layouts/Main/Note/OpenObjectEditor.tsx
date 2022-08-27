import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider, useStore } from 'store';
import { ThemeRoot } from 'utils/theme';
import useCheckPermission from 'hooks/useCheckPermission';
import useSubmitObject, { ISubmitObjectPayload } from 'hooks/useSubmitObject';
import Editor from 'components/Editor';
import { lang } from 'utils/lang';
import Dialog from 'components/Dialog';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import useActiveGroup from 'store/selectors/useActiveGroup';

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
  const { snackbarStore } = useStore();
  const checkPermission = useCheckPermission();
  const submitObject = useSubmitObject();
  const state = useLocalObservable(() => ({
    open: true,
  }));
  const activeGroup = useActiveGroup();

  const submit = async (payload: ISubmitObjectPayload) => {
    if (!await checkPermission({
      groupId: activeGroup.group_id,
      publisher: activeGroup.user_pubkey,
      trxType: 'POST',
    })) {
      snackbarStore.show({
        message: lang.beBannedTip,
        type: 'error',
        duration: 2500,
      });
      return;
    }
    await submitObject(payload);
    close();
    return true;
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
    </Dialog>
  );
});
