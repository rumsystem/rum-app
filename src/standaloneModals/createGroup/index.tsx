import React from 'react';
import { unmountComponentAtNode, render } from 'react-dom';
import { action, reaction, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import {
  Fade,
  FormControl,
  InputLabel,
  OutlinedInput,
  FormControlLabel,
  InputAdornment,
  Switch,
  Tooltip,
} from '@material-ui/core';
import {
  handleDesc,
  handleDefaultPermission,
  handleAllowMode,
  handleSubGroupConfig,
} from './handlers';
import GroupApi, { IGroup, GROUP_TEMPLATE_TYPE, GROUP_DEFAULT_PERMISSION } from 'apis/group';
import sleep from 'utils/sleep';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider, useStore } from 'store';
import useFetchGroups from 'hooks/useFetchGroups';
import TimelineIcon from 'assets/template_icon_timeline.svg?react';
import PostIcon from 'assets/template_icon_post.svg?react';
import NotebookIcon from 'assets/template_icon_note.svg?react';
import AuthDefaultReadIcon from 'assets/auth_default_read.svg?react';
import AuthDefaultWriteIcon from 'assets/auth_default_write.svg?react';
import { lang } from 'utils/lang';
import { initProfile } from 'standaloneModals/initProfile';
import pay from 'standaloneModals/pay';
import MvmAPI from 'apis/mvm';
import { useLeaveGroup } from 'hooks/useLeaveGroup';
import UserApi from 'apis/user';
import isInt from 'utils/isInt';
import BoxRadio from 'components/BoxRadio';
import BottomBar from './BottomBar';
import getRadioContentComponent from './getRadioContentComponent';

export const createGroup = async () => new Promise<void>((rs) => {
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
          <CreateGroup
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

    paidAmount: '',
    isPaidGroup: false,
    invokeFee: '',
    assetSymbol: '',

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
  const store = useStore();
  const {
    snackbarStore,
    activeGroupStore,
    confirmDialogStore,
    betaFeatureStore,
  } = store;
  const fetchGroups = useFetchGroups();
  const leaveGroup = useLeaveGroup();
  const scrollBox = React.useRef<HTMLDivElement>(null);

  const handleConfirm = () => {
    if (!state.name) {
      snackbarStore.show({
        message: lang.require(lang.groupName),
        type: 'error',
      });
      return;
    }

    if (state.isPaidGroup && !state.paidAmount) {
      snackbarStore.show({
        message: lang.require(lang.payAmount),
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
        confirmDialogStore.hide();

        await sleep(500);

        runInAction(() => { state.creating = true; });

        try {
          const { group_id: groupId } = await GroupApi.createGroup({
            group_name: state.name,
            consensus_type: state.consensusType,
            encryption_type: state.encryptionType,
            app_key: state.type,
          });
          const { groups } = await GroupApi.fetchMyGroups();
          const group = (groups || []).find((g) => g.group_id === groupId) || ({} as IGroup);
          if (state.isPaidGroup) {
            const isSuccess = await handlePaidGroup(group);
            if (!isSuccess) {
              return;
            }
          }
          await handleDefaultPermission(group, state.defaultPermission);
          if (state.defaultPermission === GROUP_DEFAULT_PERMISSION.READ || state.encryptionType === 'private') {
            await handleAllowMode(group);
          }
          if (state.desc) {
            await handleDesc(group, state.desc);
          }
          await handleSubGroupConfig(group, 'comments', store);
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
          if (group.app_key !== GROUP_TEMPLATE_TYPE.NOTE) {
            await sleep(1500);
            await initProfile(group.group_id);
          }
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

  const handlePaidGroup = async (group: IGroup) => {
    const { group_id: groupId } = group;
    const announceGroupRet = await MvmAPI.announceGroup({
      group: groupId,
      owner: group.user_eth_addr,
      amount: state.paidAmount,
      duration: 99999999,
    });
    console.log({ announceGroupRet });
    state.creating = false;
    const isSuccess = await pay({
      paymentUrl: announceGroupRet.data.url,
      desc: lang.createPaidGroupFeedTip(parseFloat(state.invokeFee), state.assetSymbol),
      check: async () => {
        const ret = await MvmAPI.fetchGroupDetail(groupId);
        return !!ret.data?.group;
      },
    });
    if (!isSuccess) {
      await leaveGroup(groupId);
      return false;
    }
    const announceRet = await UserApi.announce({
      group_id: groupId,
      action: 'add',
      type: 'user',
      memo: group.user_eth_addr,
    });
    console.log({ announceRet });
    return true;
  };

  React.useEffect(() => {
    if (state.step === 2 && state.paidGroupEnabled) {
      (async () => {
        try {
          const ret = await MvmAPI.fetchDapp();
          state.invokeFee = ret.data.invokeFee;
          state.assetSymbol = ret.data.asset.symbol;
        } catch (err) {
          console.log(err);
        }
      })();
    }
  }, [state.step, state.paidGroupEnabled]);

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
                      <div className="pt-2 ml-12 leading-relaxed">
                        {state.isPaidGroup && (
                          <div>
                            <div className="flex items-center">
                              {lang.payableTip}
                              <OutlinedInput
                                className="mx-2 w-30"
                                margin="dense"
                                value={state.paidAmount}
                                onChange={(e) => {
                                  if (!e.target.value) {
                                    state.paidAmount = '';
                                    return;
                                  }
                                  if (e.target.value === '0') {
                                    state.paidAmount = '';
                                    return;
                                  }
                                  if (isInt(e.target.value)) {
                                    state.paidAmount = `${parseInt(e.target.value, 10)}`;
                                  }
                                }}
                                spellCheck={false}
                                endAdornment={<InputAdornment position="end">{state.assetSymbol || '-'}</InputAdornment>}
                              />
                            </div>
                            <div className="mt-3 text-gray-bd text-14">
                              {lang.createPaidGroupFeedTip(state.invokeFee ? parseFloat(state.invokeFee) : '-', state.assetSymbol || '-')}
                            </div>
                          </div>
                        )}
                      </div>
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
