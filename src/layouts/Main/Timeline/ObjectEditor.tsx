import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { useStore } from 'store';
import useHasPermission from 'store/selectors/useHasPermission';
import useSubmitObject, { ISubmitObjectPayload } from 'hooks/useSubmitObject';
import Editor from 'components/Editor';
import { lang } from 'utils/lang';
import classNames from 'classnames';
import { BsPencil } from 'react-icons/bs';
import Dialog from 'components/Dialog';
import Avatar from 'components/Avatar';
import { toJS } from 'mobx';
import * as MainScrollView from 'utils/mainScrollView';
import sleep from 'utils/sleep';

const ObjectEditor = observer((props: {
  afterSubmit: () => void
}) => {
  const { snackbarStore, activeGroupStore } = useStore();
  const hasPermission = useHasPermission();
  const submitObject = useSubmitObject();
  const state = useLocalObservable(() => ({
    profile: toJS(activeGroupStore.profile),
  }));

  const submit = async (payload: ISubmitObjectPayload) => {
    if (!hasPermission) {
      snackbarStore.show({
        message: lang.beBannedTip,
        type: 'error',
        duration: 2500,
      });
      return;
    }
    await submitObject(payload, {
      delayForUpdateStore: MainScrollView.scrollTop() > 0 ? 400 : 150,
    });
    setTimeout(async () => {
      props.afterSubmit();
      await sleep(50);
      MainScrollView.scrollToTop();
    }, 0);
  };

  return (
    <div className="w-[600px] box-border px-8 py-5">
      <div className="flex items-center pb-3">
        <Avatar
          className="cursor-pointer"
          url={state.profile.avatar}
          size={40}
        />
        <div
          className="cursor-pointer ml-3 text-16 text-gray-6f max-w-60 truncate"
        >{state.profile.name}</div>
      </div>
      <div className="bg-white box-border">
        <Editor
          editorKey="object"
          placeholder={lang.andNewIdea}
          autoFocus
          minRows={3}
          submit={submit}
          enabledImage
        />
      </div>
    </div>
  );
});

export default observer(() => {
  const { sidebarStore } = useStore();
  const state = useLocalObservable(() => ({
    open: false,
  }));

  return (
    <div>
      <div
        className={classNames({
          '2lg:ml-[-250px] 2lg:scale-100 2lg:top-[255px] 2lg:left-[50%]': !sidebarStore.collapsed,
          'lg:ml-[-397px] lg:scale-100 lg:top-[255px] lg:left-[50%]': sidebarStore.collapsed,
        }, 'w-13 h-13 bg-black rounded-full flex items-center justify-center fixed bottom-[20px] right-[30px] transform scale-90 z-10 cursor-pointer')}
        onClick={() => {
          state.open = true;
        }}
      >
        <BsPencil className="text-22 opacity-95 text-white" />
      </div>
      <Dialog
        open={state.open}
        onClose={() => {
          state.open = false;
        }}
        transitionDuration={{
          enter: 300,
        }}
      >
        <ObjectEditor afterSubmit={() => {
          state.open = false;
        }}
        />
      </Dialog>
    </div>
  );
});
