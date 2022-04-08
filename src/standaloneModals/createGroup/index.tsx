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
import GroupApi, { IGroup } from 'apis/group';
import sleep from 'utils/sleep';
import { GROUP_TEMPLATE_TYPE, GROUP_CONFIG_KEY } from 'utils/constant';
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
import AuthApi from 'apis/auth';
import pay from 'standaloneModals/pay';
import MvmAPI from 'apis/mvm';
import { useLeaveGroup } from 'hooks/useLeaveGroup';
import UserApi from 'apis/user';
import isInt from 'utils/isInt';
import BoxRadio from 'components/BoxRadio';
import BottomBar from './BottomBar';

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
    isPaidGroup: false,

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

    get encryptionType() {
      return this.type === GROUP_TEMPLATE_TYPE.NOTE || this.isPaidGroup ? 'private' : 'public';
    },

    get totalStep() {
      return this.type === GROUP_TEMPLATE_TYPE.NOTE ? 2 : 3;
    },

    get typeName() {
      if (this.type === GROUP_TEMPLATE_TYPE.TIMELINE) {
        return '发布/Feed';
      }
      if (this.type === GROUP_TEMPLATE_TYPE.POST) {
        return '论坛/BBS';
      }
      if (this.type === GROUP_TEMPLATE_TYPE.NOTE) {
        return '私密笔记/Private Note';
      }
      return '';
    },
  }));
  const {
    snackbarStore,
    activeGroupStore,
    confirmDialogStore,
  } = useStore();
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
        message: lang.require('支付金额'),
        type: 'error',
      });
      return;
    }

    if (state.creating) {
      return;
    }

    confirmDialogStore.show({
      content: '种子网络建立后，将无法修改名称、权限设置和模板',
      cancelText: '返回',
      cancel: () => {
        confirmDialogStore.hide();
      },
      okText: '确认',
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
          if (state.authType === AuthType.FOLLOW_ALW_LIST) {
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
      },
    });
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
      desc: `请支付 ${parseFloat(groupDetail.data.dapp.invokeFee)} CNB 手续费以开启收费功能`,
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
                  选择模板
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
                      },
                      {
                        value: GROUP_TEMPLATE_TYPE.POST,
                        RadioContentComponent: getRadioContentComponent(PostIcon, lang.forum, 'BBS'),
                        descComponent: () => lang.forumDesc,
                      },
                      {
                        value: GROUP_TEMPLATE_TYPE.NOTE,
                        RadioContentComponent: getRadioContentComponent(NotebookIcon, lang.notebook, 'Private Note'),
                        descComponent: () => lang.noteDesc,
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
                  {state.typeName} 模板 - 权限设置
                </div>

                <div className="mt-4 text-13 text-gray-9b">
                  设置新成员加入后的内容发布权限。种子网络建立后，无法修改默认权限
                </div>

                <div className="mt-8 flex justify-center">
                  <BoxRadio
                    value={state.authType}
                    items={[
                      {
                        value: AuthType.FOLLOW_DNY_LIST,
                        RadioContentComponent: getRadioContentComponent(AuthDefaultWriteIcon, '新成员默认可写'),
                        descComponent: () => (
                          <div>
                            新加入成员默认拥有可写权限，包括发表主帖，评论主贴，回复评论，点赞等操作。管理员可以对某一成员作禁言处理。
                            <br />
                            <br />
                            {state.type === GROUP_TEMPLATE_TYPE.TIMELINE
                              && '新加入成员默认可写的 Feed 类模版，适用于时间线呈现的微博客类社交应用。'}
                            {state.type === GROUP_TEMPLATE_TYPE.POST
                              && '新加入成员默认可写的 BBS 模版，适用于话题开放，讨论自由的论坛应用。'}
                          </div>
                        ),
                      },
                      {
                        value: AuthType.FOLLOW_ALW_LIST,
                        RadioContentComponent: getRadioContentComponent(AuthDefaultReadIcon, '新成员默认只读'),
                        descComponent: () => (
                          <div>
                            新加入成员默认只读，没有权限进行发表主帖、评论主贴、回复评论、点赞等操作
                            <Tooltip
                              placement="right"
                              title="限制成员发帖但是允许成员评论、回复、点赞的权限管理功能即将开放"
                              arrow
                            >
                              <span className="text-blue-400">
                                (?)
                              </span>
                            </Tooltip>
                            。管理员可以对某一成员开放权限。
                            <br />
                            <br />
                            {state.type === GROUP_TEMPLATE_TYPE.TIMELINE
                              && '新加入成员默认只评的 Feed 类模版，适用于开放讨论的博客、内容订阅、知识分享等内容发布应用。'}
                            {state.type === GROUP_TEMPLATE_TYPE.POST
                              && '新加入成员默认只评的 Feed 类模版，适用于开放讨论的博客、内容订阅、知识分享等内容发布应用。'}
                          </div>
                        )
                        ,
                      },
                    ]}
                    onChange={(value) => {
                      state.authType = value as AuthType;
                    }}
                  />
                </div>
              </div>
            )}

            {state.step === 2 && (
              <div className="animate-fade-in">
                <div className="text-18 font-medium -mx-8">
                  {state.typeName} 模板 -设置基本信息
                </div>

                <div className="mt-2 px-5">
                  <FormControl className="mt-8 w-full" variant="outlined">
                    <InputLabel>名称（种子网络建立后不可更改）</InputLabel>
                    <OutlinedInput
                      label="名称（种子网络建立后不可更改）"
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
                            收费
                          </div>
                        )}
                      />
                      <div className="pt-2 ml-12 leading-relaxed">
                        {state.isPaidGroup && (
                          <div>
                            <div className="flex items-center">
                              其他成员加入本网络需要向你支付
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
                            </div>
                            <div className="mt-3 text-gray-bd text-14">
                              你将支付一笔手续费以开启收费功能
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
