import React from 'react';
import { createRoot } from 'react-dom/client';
import classNames from 'classnames';
import { action, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { MdEdit } from 'react-icons/md';
import { FormControl, InputLabel, OutlinedInput } from '@mui/material';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { lang } from 'utils/lang';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider, useStore } from 'store';
import GroupApi from 'apis/group';
import { GROUP_CONFIG_KEY } from 'utils/constant';
import { getGroupConfigRecord } from 'hooks/usePolling/groupConfig';
import Loading from 'components/Loading';
import ImageEditor from 'components/ImageEditor';
import sleep from 'utils/sleep';
import GroupIcon from 'components/GroupIcon';

export const manageGroup = async (groudId: string, init = false) => new Promise<void>((rs) => {
  const div = document.createElement('div');
  document.body.append(div);
  const root = createRoot(div);
  const unmount = () => {
    root.unmount();
    div.remove();
  };
  root.render(
    <ThemeRoot>
      <StoreProvider>
        <ManageGroup
          groudId={groudId}
          init={init}
          rs={() => {
            rs();
            setTimeout(unmount, 3000);
          }}
        />
      </StoreProvider>
    </ThemeRoot>,
  );
});


interface Props {
  groudId: string
  init: boolean
  rs: () => unknown
}

const ManageGroup = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    open: true,
    initiating: false,
    loading: false,

    firstLetter: '',
    originalDesc: '',
    originalIcon: '',

    name: '',
    icon: '',
    desc: '',
  }));

  const { groupStore, snackbarStore } = useStore();
  const group = groupStore.map[props.groudId];

  const handleSave = async () => {
    const groupId = props.groudId;
    runInAction(() => {
      state.loading = true;
    });

    try {
      // it take several second to sync
      await sleep(400);
      await Promise.all([
        state.icon !== state.originalIcon && GroupApi.changeGroupConfig({
          group_id: groupId,
          action: state.icon ? 'add' : 'del',
          name: GROUP_CONFIG_KEY.GROUP_ICON,
          type: 'string',
          value: state.icon ? state.icon : 'holder',
        }),
        state.desc !== state.originalDesc && GroupApi.changeGroupConfig({
          group_id: groupId,
          action: state.desc ? 'add' : 'del',
          name: GROUP_CONFIG_KEY.GROUP_DESC,
          type: 'string',
          value: state.desc ? state.desc : 'holder',
        }),
      ]);
      snackbarStore.show({
        message: lang.savedAndWaitForSyncing,
        duration: 3000,
      });
    } catch (e) {
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
    runInAction(() => {
      state.loading = false;
    });
    handleClose();
  };

  const handleClose = action(() => {
    state.open = false;
    props.rs();
  });

  React.useEffect(() => {
    const groudId = props.groudId;
    const group = groupStore.map[groudId];
    if (!group) {
      handleClose();
      return;
    }

    runInAction(() => {
      state.initiating = true;
    });
    getGroupConfigRecord(groudId).then((config) => {
      groupStore.updateGroupConfig(groudId, config);
      runInAction(() => {
        state.name = group.group_name;
        state.firstLetter = group.group_name.substring(0, 1);
        state.desc = String(groupStore.configMap.get(groudId)?.[GROUP_CONFIG_KEY.GROUP_DESC] ?? '');
        state.icon = String(groupStore.configMap.get(groudId)?.[GROUP_CONFIG_KEY.GROUP_ICON] ?? '');

        state.originalDesc = state.desc;
        state.originalIcon = state.icon;
      });
    }).finally(action(() => {
      state.initiating = false;
    }));
  }, []);

  return (<Dialog
    open={state.open}
    onClose={handleClose}
    transitionDuration={300}
  >
    <div className="bg-white rounded-0 p-6 w-[550px]">
      <div className="pt-4 px-6 pb-5">
        <div className="text-18 font-bold text-gray-700 text-center pb-5">
          {lang.manageGroupTitle}
        </div>
        {state.initiating && (
          <div className="flex flex-center h-[360px] pb-10">
            <Loading />
          </div>
        )}
        {!state.initiating && (<>
          <div className="">
            <div className="flex flex-center mt-4">
              <div className="w-20 h-20 rounded-sm border border-gray-400 relative overflow-hidden bg-gray-c4">
                <ImageEditor
                  className="opacity-0 !absolute !m-0 -inset-px"
                  width={200}
                  placeholderWidth={90}
                  editorPlaceholderWidth={200}
                  imageUrl={state.icon}
                  getImageUrl={(url: string) => {
                    state.icon = url;
                  }}
                />
                <GroupIcon width={80} height={80} fontSize={48} groupId={group?.group_id} groupIcon={state.icon} />
                <div
                  className={classNames(
                    'w-5 h-5 -mb-px -mr-px absolute right-0 bottom-0 rounded-sm',
                    'bg-gray-4a bg-opacity-40 text-white flex flex-center',
                  )}
                >
                  <MdEdit />
                </div>
              </div>
            </div>
            <FormControl className="mt-8 w-full" variant="outlined" disabled>
              <InputLabel>{lang.name}</InputLabel>
              <OutlinedInput
                label={lang.name}
                value={state.name}
                disabled
                spellCheck={false}
              />
            </FormControl>

            <FormControl className="mt-8 w-full" variant="outlined">
              <InputLabel>{lang.desc}</InputLabel>
              <OutlinedInput
                label={lang.desc}
                value={state.desc}
                onChange={action((e) => { state.desc = e.target.value; })}
                multiline
                minRows={3}
                maxRows={6}
                spellCheck={false}
              />
            </FormControl>
          </div>

          <div className="flex flex-col flex-center mt-8 text-16">
            <Button
              className='w-36 h-9'
              isDoing={state.loading}
              onClick={handleSave}
            >
              <span className="text-16">
                {lang.save}
              </span>
            </Button>

            {props.init && (
              <span
                className="mt-5 text-link-blue cursor-pointer text-14"
                onClick={handleClose}
              >
                {lang.manageGroupSkip}
              </span>
            )}
          </div>
        </>)}
      </div>
    </div>
  </Dialog>);
});
