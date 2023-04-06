import React from 'react';
import { createRoot } from 'react-dom/client';
import { action, reaction, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import {
  Fade,
  FormControl,
  InputLabel,
  OutlinedInput,
  FormControlLabel,
  Switch,
  Tooltip,
} from '@mui/material';
import GroupApi, { IGroup } from 'apis/group';
import sleep from 'utils/sleep';
import { GROUP_TEMPLATE_TYPE, GROUP_CONFIG_KEY, GROUP_DEFAULT_PERMISSION } from 'utils/constant';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider, useStore } from 'store';
import fetchGroups from 'hooks/fetchGroups';
import TimelineIcon from 'assets/template_icon_timeline.svg?react';
import PostIcon from 'assets/template_icon_post.svg?react';
import NotebookIcon from 'assets/template_icon_note.svg?react';
import AuthDefaultReadIcon from 'assets/auth_default_read.svg?react';
import AuthDefaultWriteIcon from 'assets/auth_default_write.svg?react';
import { lang } from 'utils/lang';
// import { initProfile } from 'standaloneModals/initProfile';
import AuthApi from 'apis/auth';
import BoxRadio from 'components/BoxRadio';
import BottomBar from './BottomBar';
import UserApi from 'apis/user';

export const createGroup = async () => new Promise<void>((rs) => {
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
        <CreateGroup
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
  rs: () => unknown
}

const CreateGroup = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    open: false,
    step: 0,

    type: GROUP_TEMPLATE_TYPE.TIMELINE,
    name: '',
    desc: '',
    consensusType: 'poa',
    defaultPermission: GROUP_DEFAULT_PERMISSION.WRITE as GROUP_DEFAULT_PERMISSION,

    isPaidGroup: false,

    creating: false,

    get descEnabled() {
      return this.type !== GROUP_TEMPLATE_TYPE.NOTE;
    },

    get paidGroupEnabled() {
      return this.type !== GROUP_TEMPLATE_TYPE.NOTE && betaFeatureStore.betaFeatures.includes('PAID_GROUP');
    },

    get isAuthEnabled() {
      return this.type !== GROUP_TEMPLATE_TYPE.NOTE;
    },

    get encryptionType() {
      return this.type === GROUP_TEMPLATE_TYPE.NOTE || this.isPaidGroup ? 'private' : 'public';
    },

    get totalStep() {
      return this.type === GROUP_TEMPLATE_TYPE.NOTE ? 2 : 3;
    },

    get typeName() {
      if (this.type === GROUP_TEMPLATE_TYPE.TIMELINE) {
        return lang.feedTemplateName;
      }
      if (this.type === GROUP_TEMPLATE_TYPE.POST) {
        return lang.bbsTemplateName;
      }
      if (this.type === GROUP_TEMPLATE_TYPE.NOTE) {
        return lang.noteTemplateName;
      }
      return '';
    },
  }));
  const {
    snackbarStore,
    activeGroupStore,
    confirmDialogStore,
    betaFeatureStore,
  } = useStore();
  const scrollBox = React.useRef<HTMLDivElement>(null);

  const handleConfirm = () => {
    if (!state.name) {
      snackbarStore.show({
        message: lang.require(lang.groupName),
        type: 'error',
      });
      return;
    }

    if (state.creating) {
      return;
    }

    confirmDialogStore.show({
      content: lang.unchangedGroupConfigTip,
      cancelText: lang.back,
      cancel: () => {
        confirmDialogStore.hide();
      },
      ok: async () => {
        runInAction(() => { state.creating = true; });

        confirmDialogStore.hide();

        await sleep(500);

        try {
          const { group_id: groupId } = await GroupApi.createGroup({
            group_name: state.name,
            consensus_type: state.consensusType,
            encryption_type: state.encryptionType,
            app_key: state.type,
          });
          const { groups } = await GroupApi.fetchMyGroups();
          const group = (groups || []).find((g) => g.group_id === groupId) || ({} as IGroup);
          await handleDefaultPermission(group);
          if (state.defaultPermission === GROUP_DEFAULT_PERMISSION.READ || state.encryptionType === 'private') {
            await handleAllowMode(group);
          }
          if (state.desc) {
            await handleDesc(group);
          }
          if (state.isPaidGroup) {
            const announceRet = await UserApi.announce({
              group_id: groupId,
              action: 'add',
              type: 'user',
              memo: 'paid_group',
            });
            console.log({ announceRet });
          }
          await sleep(150);
          await fetchGroups();
          await sleep(150);
          activeGroupStore.setId(group.group_id);
          await sleep(150);
          snackbarStore.show({
            message: lang.created,
            duration: 1000,
          });
          handleClose();
          // if (group.app_key !== GROUP_TEMPLATE_TYPE.NOTE) {
          //   await sleep(1500);
          //   await initProfile(group.group_id);
          // }
        } catch (err) {
          console.error(err);
          runInAction(() => { state.creating = false; });
          snackbarStore.show({
            message: lang.somethingWrong,
            type: 'error',
          });
        }
      },
      confirmTestId: 'create-group-confirm-modal-confirm',
    });
  };

  const handleDesc = async (group: IGroup) => {
    await GroupApi.changeGroupConfig({
      group_id: group.group_id,
      action: 'add',
      name: GROUP_CONFIG_KEY.GROUP_DESC,
      type: 'string',
      value: state.desc,
    });
  };

  const handleDefaultPermission = async (group: IGroup) => {
    await GroupApi.changeGroupConfig({
      group_id: group.group_id,
      action: 'add',
      name: GROUP_CONFIG_KEY.GROUP_DEFAULT_PERMISSION,
      type: 'string',
      value: state.defaultPermission,
    });
  };

  const handleAllowMode = async (group: IGroup) => {
    await AuthApi.updateFollowingRule({
      group_id: group.group_id,
      type: 'set_trx_auth_mode',
      config: {
        trx_type: 'POST',
        trx_auth_mode: 'follow_alw_list',
        memo: '',
      },
    });
    await AuthApi.updateAuthList({
      group_id: group.group_id,
      type: 'upd_alw_list',
      config: {
        action: 'add',
        pubkey: group.user_pubkey,
        trx_type: ['post'],
        memo: '',
      },
    });
  };

  const handleClose = action(() => {
    props.rs();
    state.open = false;
  });

  React.useEffect(() => reaction(
    () => state.step,
    () => {
      if (scrollBox.current) {
        scrollBox.current.scrollTop = 0;
      }
    },
  ), []);

  React.useEffect(action(() => {
    state.open = true;
  }), []);

  return (
    <Fade
      in={state.open}
      timeout={200}
      mountOnEnter
      unmountOnExit
    >
      <div className="fixed inset-0 top-[40px] bg-gray-f7 z-50 overflow-auto">
        <div
          className="flex justify-center"
          ref={scrollBox}
        >
          <div className="w-[720px] text-gray-6d my-8 px-20 pt-8 pb-16 bg-white">
            {state.step === 0 && (
              <div className="animate-fade-in">
                <div className="text-18 font-medium -mx-8 animate-fade-in">
                  {lang.chooseTemplate}
                </div>

                <div className="mt-4 text-13 text-gray-9b">
                  {lang.groupTypeDesc}
                </div>

                <div className="mt-8">
                  <BoxRadio
                    value={state.type}
                    items={[
                      {
                        value: GROUP_TEMPLATE_TYPE.TIMELINE,
                        RadioContentComponent: getRadioContentComponent(TimelineIcon, lang.sns, 'Feed'),
                        descComponent: () => lang.snsDesc,
                        'data-test-id': `group-type-${GROUP_TEMPLATE_TYPE.TIMELINE}`,
                      },
                      {
                        value: GROUP_TEMPLATE_TYPE.POST,
                        RadioContentComponent: getRadioContentComponent(PostIcon, lang.forum, 'BBS'),
                        descComponent: () => lang.forumDesc,
                        'data-test-id': `group-type-${GROUP_TEMPLATE_TYPE.POST}`,
                      },
                      {
                        value: GROUP_TEMPLATE_TYPE.NOTE,
                        RadioContentComponent: getRadioContentComponent(NotebookIcon, lang.notebook, 'Private Note'),
                        descComponent: () => lang.noteDesc,
                        'data-test-id': `group-type-${GROUP_TEMPLATE_TYPE.NOTE}`,
                      },
                    ]}
                    onChange={(value) => {
                      state.type = value as GROUP_TEMPLATE_TYPE;
                    }}
                  />
                </div>
              </div>
            )}

            {state.step === 1 && (
              <div className="animate-fade-in">
                <div className="text-18 font-medium -mx-8 animate-fade-in">
                  {state.typeName} {lang.template} - {lang.authSettings}
                </div>

                <div className="mt-4 text-13 text-gray-9b">
                  {lang.immutableAuthSettingsTip}
                </div>

                <div className="mt-8 flex justify-center">
                  <BoxRadio
                    value={state.defaultPermission}
                    items={[
                      {
                        value: GROUP_DEFAULT_PERMISSION.WRITE,
                        RadioContentComponent: getRadioContentComponent(AuthDefaultWriteIcon, lang.defaultWriteTypeTip),
                        descComponent: () => (
                          <div>
                            {lang.defaultWriteTip}
                          </div>
                        ),
                      },
                      {
                        value: GROUP_DEFAULT_PERMISSION.READ,
                        RadioContentComponent: getRadioContentComponent(AuthDefaultReadIcon, lang.defaultReadTypeTip),
                        descComponent: () => (
                          <div>
                            {lang.defaultReadTip1}
                            <Tooltip
                              placement="right"
                              title={lang.defaultReadTip2}
                              arrow
                              disableInteractive
                            >
                              <span className="text-blue-400">
                                (?)
                              </span>
                            </Tooltip>
                            {lang.defaultReadTip3}
                          </div>
                        )
                        ,
                      },
                    ]}
                    onChange={(value) => {
                      state.defaultPermission = value as GROUP_DEFAULT_PERMISSION;
                    }}
                  />
                </div>
              </div>
            )}

            {state.step === 2 && (
              <div className="animate-fade-in">
                <div className="text-18 font-medium -mx-8">
                  {state.typeName} {lang.template} - {lang.basicInfoSettings}
                </div>

                <div className="mt-2 px-5">
                  <FormControl className="mt-8 w-full" variant="outlined">
                    <InputLabel>{lang.name}{lang.immutableGroupNameTip}</InputLabel>
                    <OutlinedInput
                      label={`${lang.name}${lang.immutableGroupNameTip}`}
                      value={state.name}
                      onChange={action((e) => { state.name = e.target.value; })}
                      spellCheck={false}
                      autoFocus
                      data-test-id="create-group-name-input"
                    />
                  </FormControl>
                  {state.descEnabled && (
                    <FormControl className="mt-8 w-full" variant="outlined">
                      <InputLabel>{lang.desc + `(${lang.optional})`}</InputLabel>
                      <OutlinedInput
                        label={lang.desc + `(${lang.optional})`}
                        value={state.desc}
                        onChange={action((e) => { state.desc = e.target.value; })}
                        multiline
                        minRows={3}
                        maxRows={6}
                        spellCheck={false}
                      />
                    </FormControl>
                  )}
                  {state.paidGroupEnabled && (
                    <div className="mt-5">
                      <FormControlLabel
                        control={<Switch
                          checked={state.isPaidGroup}
                          color='primary'
                          onChange={(e) => {
                            state.isPaidGroup = e.target.checked;
                          }}
                        />}
                        label={(
                          <div className="text-gray-6f">
                            {lang.payable}
                          </div>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-14 animate-fade-in">
              <BottomBar
                total={state.totalStep}
                creating={state.creating}
                step={state.step}
                onChange={(step) => {
                  if (step === 1 && !state.isAuthEnabled) {
                    state.step = step > state.step ? 2 : 0;
                  } else {
                    state.step = step;
                  }
                }}
                handleConfirm={handleConfirm}
                handleClose={handleClose}
              />
            </div>
          </div>
        </div>
      </div>
    </Fade>
  );
});

const getRadioContentComponent = (Icon: any, name: string, label?: string) => () => (
  (
    <div className="leading-none w-[174px] h-32 flex flex-col flex-center">
      <div className="-mt-2 h-[58px] flex flex-center overflow-hidden">
        <div className="transform scale-75">
          <Icon />
        </div>
      </div>
      <div className="mt-2 text-gray-6f font-bold">
        {name}
      </div>
      {label && (
        <div className="mt-2 text-gray-9c text-12">
          {label}
        </div>
      )}
    </div>
  )
);
