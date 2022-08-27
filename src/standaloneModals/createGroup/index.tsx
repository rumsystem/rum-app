import React from 'react';
import { unmountComponentAtNode, render } from 'react-dom';
import classNames from 'classnames';
import { action, reaction, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import {
  Fade,
  FormControl,
  InputLabel,
  OutlinedInput,
  Radio,
  FormControlLabel,
  InputAdornment,
  RadioGroup,
  Tooltip,
} from '@material-ui/core';
import GroupApi, { IGroup } from 'apis/group';
import Button from 'components/Button';
import sleep from 'utils/sleep';
import { GROUP_TEMPLATE_TYPE, GROUP_CONFIG_KEY } from 'utils/constant';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider, useStore } from 'store';
import useFetchGroups from 'hooks/useFetchGroups';
import TimelineIcon from 'assets/template/template_icon_timeline.svg?react';
import PostIcon from 'assets/template/template_icon_post.svg?react';
import NotebookIcon from 'assets/template/template_icon_notebook.svg?react';
import { lang } from 'utils/lang';
import { initProfile } from 'standaloneModals/initProfile';
import { StepBox } from './StepBox';
import AuthApi from 'apis/auth';
import pay from 'standaloneModals/pay';
import MvmAPI from 'apis/mvm';
import { useLeaveGroup } from 'hooks/useLeaveGroup';
import UserApi from 'apis/user';
import { BsQuestionCircle } from 'react-icons/bs';
import isInt from 'utils/isInt';

enum AuthType {
  FOLLOW_DNY_LIST = 'FOLLOW_DNY_LIST',
  FOLLOW_ALW_LIST = 'FOLLOW_ALW_LIST',
  PAID = 'PAID',
}

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
    authType: AuthType.FOLLOW_DNY_LIST as AuthType,

    paidAmount: '',

    creating: false,

    get descEnabled() {
      return this.type !== GROUP_TEMPLATE_TYPE.NOTE;
    },

    get paidGroupEnabled() {
      return this.type !== GROUP_TEMPLATE_TYPE.NOTE;
    },

    get isAuthEnabled() {
      return this.type !== GROUP_TEMPLATE_TYPE.NOTE;
    },

    get isPaidGroup() {
      return this.authType === AuthType.PAID;
    },

    get encryptionType() {
      return this.type === GROUP_TEMPLATE_TYPE.NOTE || this.isPaidGroup ? 'private' : 'public';
    },
  }));
  const {
    snackbarStore,
    activeGroupStore,
  } = useStore();
  const fetchGroups = useFetchGroups();
  const leaveGroup = useLeaveGroup();
  const scrollBox = React.useRef<HTMLDivElement>(null);

  const handleTypeChange = action((type: GROUP_TEMPLATE_TYPE) => {
    state.type = type;
  });

  const handleStepChange = action((i: number) => {
    if (i < state.step) {
      state.step = i;
    }
  });

  const handleNextStep = action(() => {
    if (state.step === 1) {
      if (!state.name) {
        snackbarStore.show({
          message: '请输入群组名称',
          type: 'error',
        });
        return;
      }
      if (!state.name || state.name.length < 5) {
        snackbarStore.show({
          message: '名称至少要输入5个字哦',
          type: 'error',
        });
        return;
      }
    }

    state.step += 1;
  });

  const handlePrevStep = action(() => {
    if (state.creating) {
      return;
    }
    state.step -= 1;
  });

  const handleConfirm = async () => {
    if (!state.name) {
      snackbarStore.show({
        message: lang.require(lang.groupName),
        type: 'error',
      });
      return;
    }

    if (state.isPaidGroup && !state.paidAmount) {
      snackbarStore.show({
        message: lang.require('支付金额'),
        type: 'error',
      });
      return;
    }

    if (state.creating) {
      return;
    }

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
      if (state.authType === AuthType.FOLLOW_ALW_LIST) {
        await handleAllowMode(group);
      }
      if (state.isPaidGroup) {
        const isSuccess = await handlePaidGroup(group);
        if (!isSuccess) {
          return;
        }
        await handleAllowMode(group);
      }
      if (state.desc) {
        await handleDesc(group);
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
  };

  const handlePaidGroup = async (group: IGroup) => {
    const { group_id: groupId } = group;
    const groupDetail = await MvmAPI.fetchGroupDetail(groupId);
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
      desc: `请支付 ${parseFloat(groupDetail.data.dapp.invokeFee)} CNB 以开启收费功能`,
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

  const handleDesc = async (group: IGroup) => {
    await GroupApi.changeGroupConfig({
      group_id: group.group_id,
      action: 'add',
      name: GROUP_CONFIG_KEY.GROUP_DESC,
      type: 'string',
      value: state.desc,
    });
  };

  const handleAllowMode = async (group: IGroup) => {
    await AuthApi.updateFollowingRule({
      group_id: group.group_id,
      type: 'set_trx_auth_mode',
      config: {
        trx_type: 'POST',
        trx_auth_mode: 'FOLLOW_ALW_LIST',
        memo: '',
      },
    });
    await AuthApi.updateAuthList({
      group_id: group.group_id,
      type: 'upd_alw_list',
      config: {
        action: 'add',
        pubkey: group.user_pubkey,
        trx_type: ['POST'],
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
      timeout={500}
      mountOnEnter
      unmountOnExit
    >
      <div className="flex flex-col items-stretch fixed inset-0 top-[40px] bg-gray-f7 z-50">
        <div
          className="flex flex-col items-center overflow-auto flex-1"
          ref={scrollBox}
        >
          <div className="w-[800px] flex-1 text-gray-6d my-8 px-10 py-6 bg-white">
            {state.step === 0 && (<>
              <div className="text-18 font-medium">
                {lang.createGroup} - {lang.chooseTemplate}
              </div>

              <div className="mt-3 text-12 text-gray-9c">
                {lang.groupTypeDesc}
              </div>

              <div className="flex justify-center gap-x-20 mt-16 mb-6">
                {([
                  [lang.sns, GROUP_TEMPLATE_TYPE.TIMELINE, TimelineIcon],
                  [lang.forum, GROUP_TEMPLATE_TYPE.POST, PostIcon],
                  [lang.notebook, GROUP_TEMPLATE_TYPE.NOTE, NotebookIcon],
                ] as const).map(([name, type, GroupIcon], i) => (
                  <div
                    className={classNames(
                      'flex flex-col items-center select-none cursor-pointer px-4',
                    )}
                    data-test-id={`group-type-${type}`}
                    onClick={() => handleTypeChange(type)}
                    key={i}
                  >
                    <div className="relative">
                      &nbsp;
                      <div className="absolute text-black whitespace-nowrap text-16 left-1/2 -translate-x-1/2 top-0">
                        {name}
                      </div>
                    </div>
                    <div className="mt-2 h-14 flex flex-center">
                      <GroupIcon
                        className="w-14 text-black"
                        style={{
                          strokeWidth: 2,
                        }}
                      />
                    </div>
                    <div className="text-16 flex items-center">
                      <Radio
                        disableRipple
                        color="primary"
                        size="small"
                        checked={state.type === type}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-14 px-5">
                {state.type === GROUP_TEMPLATE_TYPE.TIMELINE && (
                  <div className="animate-fade-in text-center">
                    {lang.snsDesc}
                  </div>
                )}
                {state.type === GROUP_TEMPLATE_TYPE.POST && (
                  <div className="animate-fade-in text-center">
                    {lang.forumDesc}
                  </div>
                )}
                {state.type === GROUP_TEMPLATE_TYPE.NOTE && (
                  <div className="animate-fade-in text-center">
                    {lang.noteDesc}
                  </div>
                )}
              </div>
            </>)}

            {state.step === 1 && (
              <div>
                <div className="text-18 font-medium">
                  设置种子网络
                </div>

                <div className="mt-3 text-12 text-gray-9c">
                  请完善种子网络的配置信息
                </div>

                <div className="mt-2 px-5">
                  <FormControl className="mt-8 w-full" variant="outlined">
                    <InputLabel>{lang.name}</InputLabel>
                    <OutlinedInput
                      label={lang.name}
                      value={state.name}
                      onChange={action((e) => { state.name = e.target.value; })}
                      spellCheck={false}
                      autoFocus
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
                  <div className="pt-6">
                    <FormControl>
                      <RadioGroup
                        value={state.authType}
                        onChange={(e) => {
                          state.authType = e.target.value as AuthType;
                        }}
                      >
                        {state.isAuthEnabled && (
                          <FormControlLabel
                            value={AuthType.FOLLOW_DNY_LIST}
                            control={<Radio color="primary" />}
                            label={(
                              <div className="flex items-center">
                                新成员默认可写
                                <Tooltip
                                  placement="right"
                                  title="新加入成员默认拥有可写权限，包括发表主帖，评论主贴，回复评论，点赞等操作。适用于时间线呈现的微博客类社交应用"
                                  arrow
                                >
                                  <div>
                                    <BsQuestionCircle className="ml-2 text-12 opacity-85" />
                                  </div>
                                </Tooltip>
                              </div>
                            )}
                          />
                        )}
                        {state.isAuthEnabled && (
                          <FormControlLabel
                            value={AuthType.FOLLOW_ALW_LIST}
                            control={<Radio color="primary" />}
                            label={(
                              <div className="flex items-center">
                                新成员默认只读
                                <Tooltip
                                  placement="right"
                                  title="新加入成员默认只读，没有权限进行发表主帖、评论主贴、回复评论、点赞等操作。适用于个人博客、内容订阅、知识分享等内容发布应用"
                                  arrow
                                >
                                  <div>
                                    <BsQuestionCircle className="ml-2 text-12 opacity-85" />
                                  </div>
                                </Tooltip>
                              </div>
                            )}
                          />
                        )}
                        {state.paidGroupEnabled && (
                          <FormControlLabel value={AuthType.PAID} control={<Radio color="primary" />} label="收费" />
                        )}
                      </RadioGroup>
                    </FormControl>
                  </div>
                  {state.isPaidGroup && (
                    <div className="my-3 flex items-center">
                      他人需要支付
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
                        endAdornment={<InputAdornment position="end">CNB</InputAdornment>}
                      />
                      才可以使用
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <StepBox
            className="mb-8"
            total={2}
            value={state.step}
            onSelect={handleStepChange}
          />
        </div>

        <div className="flex self-stretch justify-center items-center h-24 bg-white">
          <div className="flex items-center gap-x-8 absolute left-0 ml-20">
            {state.step === 0 && (
              <Button
                className='w-40 h-12 border'
                outline
                onClick={() => {
                  if (!state.creating) {
                    handleClose();
                  }
                }}
              >
                <span
                  className={classNames(
                    'text-16',
                  )}
                >
                  {lang.cancel}
                </span>
              </Button>
            )}
            {state.step !== 0 && (
              <Button
                outline
                className="w-40 h-12 rounded-md"
                onClick={handlePrevStep}
              >
                <span
                  className='text-16'
                >
                  上一步
                </span>
              </Button>
            )}
          </div>
          <div className="flex items-center gap-x-8 absolute right-0 mr-20">
            {(state.step !== 1) && (
              <Button
                className="w-40 h-12 rounded-md"
                onClick={handleNextStep}
              >
                <span className="text-16">
                  下一步
                </span>
              </Button>
            )}
            {(state.step === 1) && (
              <Button
                className="h-12"
                onClick={handleConfirm}
                isDoing={state.creating}
                data-test-id="group-create-confirm"
              >
                <span className="text-16 px-2">
                  {lang.createGroup}
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Fade>
  );
});
