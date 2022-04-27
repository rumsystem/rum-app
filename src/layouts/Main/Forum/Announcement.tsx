import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { FiChevronsDown } from 'react-icons/fi';
import { IoMdClose } from 'react-icons/io';
import { FaBullhorn } from 'react-icons/fa';
import Fade from '@material-ui/core/Fade';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { IUser } from 'hooks/useDatabase/models/person';
import * as PersonModel from 'hooks/useDatabase/models/person';
import useDatabase from 'hooks/useDatabase';
import { useStore } from 'store';
import { ObjectsFilterType } from 'store/activeGroup';
import ago from 'utils/ago';
import { lang } from 'utils/lang';
import sleep from 'utils/sleep';
import { MDEditor } from './MDEditor';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import GroupApi, { GROUP_CONFIG_KEY } from 'apis/group';
import useIsCurrentGroupOwner from 'store/selectors/useIsCurrentGroupOwner';
import DOMPurify from 'dompurify';
import { defaultRenderer } from 'utils/markdown';
import Loading from 'components/Loading';
import GroupIcon from 'components/GroupIcon';

export default observer(() => {
  const state = useLocalObservable(() => ({
    openDetailModal: false,
    openEditorModal: false,
    syncing: false,
  }));
  const { activeGroupStore, groupStore } = useStore();
  const announcement = (groupStore.configMap.get(activeGroupStore.id)?.[GROUP_CONFIG_KEY.GROUP_ANNOUNCEMENT] ?? '') as string;
  const groupDesc = (groupStore.configMap.get(activeGroupStore.id)?.[GROUP_CONFIG_KEY.GROUP_DESC] ?? '') as string;
  const isGroupOwner = useIsCurrentGroupOwner();

  React.useEffect(() => {
    state.syncing = false;
  }, [announcement]);

  if (!isGroupOwner && !announcement) {
    return null;
  }

  return (
    <div className="relative">
      <div
        className="cursor-pointer"
        onClick={() => {
          if (announcement) {
            state.openDetailModal = true;
          } else {
            state.openEditorModal = true;
          }
        }}
      >
        <div className="border-4 border-white rounded-full shadow-5 overflow-hidden">
          <GroupIcon width={56} height={56} fontSize={26} groupId={activeGroupStore.id} />
        </div>
        <div className="text-blue-400 mt-[14px] text-center text-13 leading-none">
          {announcement ? lang.expand : lang.edit}
          {state.syncing && (
            <div className="mt-2 flex justify-center">
              <Loading size={12} color="rgb(96, 165, 250)" />
            </div>
          )}
          {!state.syncing && announcement && (
            <div className="mt-1 flex justify-center">
              <FiChevronsDown className="text-15" />
            </div>
          )}
        </div>
      </div>
      {state.openDetailModal && (
        <DetailModal
          groupDesc={groupDesc}
          announcement={announcement}
          openEditor={() => {
            state.openEditorModal = true;
          }}
          onClose={() => {
            state.openDetailModal = false;
          }}
        />
      )}
      <Dialog
        open={state.openEditorModal}
        onClose={() => {
          state.openEditorModal = false;
        }}
        transitionDuration={{
          enter: 300,
        }}
      >
        <EditorModal
          announcement={announcement}
          saved={() => {
            state.syncing = true;
          }}
          onClose={() => {
            state.openEditorModal = false;
          }}
        />
      </Dialog>
    </div>
  );
});

interface IProps {
  groupDesc: string
  announcement: string
  openEditor: () => void
  onClose: () => void
}

const DetailModal = observer((props: IProps) => {
  const database = useDatabase();
  const state = useLocalObservable(() => ({
    loading: true,
    owner: {} as IUser,
  }));
  const { activeGroupStore } = useStore();
  const activeGroup = useActiveGroup();
  const isGroupOwner = useIsCurrentGroupOwner();
  const { groupDesc } = props;
  const announcement = React.useMemo(() => {
    try {
      return DOMPurify.sanitize(defaultRenderer.render(props.announcement));
    } catch (err) {
      return '';
    }
  }, [props.announcement]);

  React.useEffect(() => {
    (async () => {
      const db = database;
      const user = await PersonModel.getUser(db, {
        GroupId: activeGroup.group_id,
        Publisher: activeGroup.owner_pubkey,
      });
      state.owner = user;
      state.loading = false;
    })();
  }, []);

  const goToUserPage = async (publisher: string) => {
    props.onClose();
    await sleep(300);
    activeGroupStore.setObjectsFilter({
      type: ObjectsFilterType.SOMEONE,
      publisher,
    });
  };

  return (
    <Fade in={true} timeout={500}>
      <div className="bg-gray-33 w-[320px] absolute top-0 right-0">
        <div className="h-14 bg-gray-6f flex items-center justify-end">
          <div className="text-26 text-white opacity-90 px-5 cursor-pointer z-10" onClick={props.onClose}>
            <IoMdClose />
          </div>
        </div>
        <div className="absolute top-0 left-0 w-full flex justify-center">
          <div className="mt-[-17px] border-4 border-white rounded-full shadow-5 overflow-hidden cursor-pointer">
            <GroupIcon width={80} height={80} fontSize={38} groupId={activeGroupStore.id} />
          </div>
        </div>
        <div className="py-8 px-6 text-gray-f2 overflow-y-auto max-h-[70vh]">
          <div className="text-gary-99 text-16 font-bold text-center">
            {activeGroup.group_name}
          </div>
          <div className="flex items-center justify-center text-12 mt-2">
            <div className="flex items-center">
              <span className="text-gary-99 opacity-70">{lang.owner}</span>
              {!state.loading && (
                <span
                  className="text-[#5fc0e9] cursor-pointer ml-1"
                  onClick={() => {
                    goToUserPage(state.owner.publisher);
                  }}
                >{state.owner.profile.name}</span>
              )}
            </div>
            <span className="text-gary-99 opacity-70">
              ，{ago(activeGroup.last_updated)}{lang.update}
            </span>
          </div>
          <div className="mt-3 rendered-markdown">
            {groupDesc}
          </div>
          <div className="flex items-center justify-center mt-5 opacity-95">
            <span className="h-px bg-gray-99 w-18 mr-3" />
            <span className="text-gray-99 flex items-center"><FaBullhorn className="text-14 mr-2" /> {lang.announcement}</span>
            <span className="h-px bg-gray-99 w-18 ml-3" />
          </div>
          <div
            className="mt-3 rendered-markdown"
            dangerouslySetInnerHTML={{
              __html: announcement,
            }}
          />
          {isGroupOwner && (
            <div
              className="mt-1 text-[#5fc0e9] cursor-pointer text-12"
              onClick={() => {
                props.openEditor();
                props.onClose();
              }}
            >
              {lang.edit}
            </div>
          )}
        </div>
        <style jsx>{`
          .rendered-markdown {
            color: #f2f2f2 !important;
          }
        `}</style>
      </div>
    </Fade>
  );
});

const EditorModal = observer((props: {
  announcement: string
  saved: () => void
  onClose: () => void
}) => {
  const { activeGroupStore, snackbarStore } = useStore();
  const state = useLocalObservable(() => ({
    content: props.announcement,
    submitting: false,
  }));

  const submit = async () => {
    if (state.submitting) {
      return;
    }
    state.submitting = true;
    await sleep(400);
    try {
      await GroupApi.changeGroupConfig({
        group_id: activeGroupStore.id,
        action: state.content ? 'add' : 'del',
        name: GROUP_CONFIG_KEY.GROUP_ANNOUNCEMENT,
        type: 'string',
        value: state.content || 'holder',
      });
      snackbarStore.show({
        message: lang.savedAndWaitForSyncing,
        duration: 3000,
      });
      props.saved();
    } catch (_) {
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
    state.submitting = false;
    props.onClose();
  };

  return (
    <div className="w-[450px] box-border px-8 py-6">
      <div className="bg-white box-border">
        <div className="text-18 font-medium text-gray-4a text-center">
          {lang.editAnnouncement}
        </div>
        <div className="flex flex-col h-[250px] pt-6">
          <MDEditor
            className="flex-1 h-0"
            minHeight='200'
            value={state.content ?? ''}
            onChange={(data: string) => {
              state.content = data;
            }}
          />
        </div>
        <div className="flex justify-center mt-6">
          <Button disabled={props.announcement === state.content} onClick={submit} isDoing={state.submitting}>
            {lang.save}
          </Button>
        </div>
      </div>
    </div>
  );
});
