import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import classNames from 'classnames';
import { action, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { MdEdit } from 'react-icons/md';
import { FormControl, InputLabel, OutlinedInput } from '@material-ui/core';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { lang } from 'utils/lang';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider, useStore } from 'store';
import GroupApi from 'apis/group';
import { GROUP_CONFIG_KEY } from 'utils/constant';
import { getGroupConfig } from 'hooks/usePolling/usePollingGroupConfig';
import Loading from 'components/Loading';
import ImageEditor from 'components/ImageEditor';

export const manageGroup = async (groudId: string, init = false) => new Promise<void>((rs) => {
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
          <ManageGroup
            groudId={groudId}
            init={init}
            rs={() => {
              rs();
              setTimeout(unmount, 3000);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
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

  const handleSave = async () => {
    const groupId = props.groudId;
    runInAction(() => {
      state.loading = true;
    });

    try {
      // it take several second to sync
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
    getGroupConfig(groudId).then((config) => {
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

  return (<>
    <Dialog
      open={state.open}
      onClose={handleClose}
      transitionDuration={{
        enter: 300,
      }}
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
                    width={80}
                    placeholderWidth={80}
                    editorPlaceholderWidth={200}
                    imageUrl={state.icon}
                    getImageUrl={(url: string) => {
                      state.icon = url;
                    }}
                  />
                  {!!state.icon && <img src={state.icon} alt="" />}
                  {!state.icon && (
                    <div className="w-full h-full flex flex-center group-letter text-white font-bold uppercase">
                      {state.firstLetter}
                    </div>
                  )}
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
                <InputLabel>{lang.groupName}</InputLabel>
                <OutlinedInput
                  label={lang.groupName}
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
    </Dialog>
    <style jsx>{`
      .group-letter {
        font-family: Nunito Sans, PingFang SC, Hiragino Sans GB, Heiti SC, Varela Round, '幼圆', '圆体-简', sans-serif;
        font-size: 48px;
      }
    `}</style>
  </>);
});
