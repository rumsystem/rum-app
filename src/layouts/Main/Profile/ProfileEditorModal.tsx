import React from 'react';
import { runInAction, toJS } from 'mobx';
import classNames from 'classnames';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Loading from 'components/Loading';
import { TextField, Checkbox } from '@material-ui/core';
import Button from 'components/Button';
import { isWindow } from 'utils/env';
import sleep from 'utils/sleep';
import { useStore } from 'store';
import { client_id, getVerifierAndChanllege, getOAuthUrl } from 'utils/mixinOAuth';
import { getAccessToken, getUserProfile } from 'apis/mixin';
import ImageEditor from 'components/ImageEditor';
import Tooltip from '@material-ui/core/Tooltip';
import useSubmitPerson from 'hooks/useSubmitPerson';
import useOffChainDatabase from 'hooks/useOffChainDatabase';
import * as globalProfileModel from 'hooks/useOffChainDatabase/models/globalProfile';
import { MdInfo } from 'react-icons/md';
import { BiWallet } from 'react-icons/bi';
import { isEqual } from 'lodash';
import useDatabase from 'hooks/useDatabase';
import * as PersonModel from 'hooks/useDatabase/models/person';
import MiddleTruncate from 'components/MiddleTruncate';
import { GoChevronRight } from 'react-icons/go';

interface IProps {
  open: boolean
  onClose: () => void
}

interface BindMixinModalProps {
  open: boolean
  onClose: () => void
  onBind: (mixinUID: string) => void
}

const MixinOAuth = observer((props: BindMixinModalProps) => {
  const { snackbarStore } = useStore();
  const { onClose, onBind } = props;
  const state = useLocalObservable(() => ({
    verifier: null as null | string,
    challenge: null as null | string,
    oauthUrl: null as null | string,
    webviewLoading: true,
    webview: null as null | HTMLWebViewElement,
  }));


  const loadStop = React.useCallback(() => {
    if ((state.webview as any)?.getURL() === state.oauthUrl) {
      runInAction(() => {
        state.webviewLoading = false;
      });
    }
  }, []);

  const handleOauthFailure = () => {
    onClose();
    snackbarStore.show({
      message: '获取mixin信息失败',
      type: 'error',
    });
  };

  const redirecting = React.useCallback(async (event: Event) => {
    const currentUrl = (event as Event & {url: string}).url;
    if (currentUrl !== state.oauthUrl) {
      runInAction(() => {
        state.webviewLoading = true;
      });
      const regExp = /code=([^&#]*)/g;
      const code = regExp.exec(currentUrl)?.[1];
      if (code && state.verifier) {
        try {
          const res = await getAccessToken({ client_id, code, code_verifier: state.verifier });
          if (res?.data?.access_token) {
            const res2 = await getUserProfile(res.data.access_token);
            if (res2?.data?.user_id) {
              onBind(res2?.data?.user_id);
              onClose();
            } else {
              handleOauthFailure();
            }
          } else {
            handleOauthFailure();
          }
        } catch (e) {
          console.warn(e);
          handleOauthFailure();
        }
      } else {
        handleOauthFailure();
      }
    }
  }, []);

  React.useEffect(() => {
    const { verifier, challenge } = getVerifierAndChanllege();
    const oauthUrl = getOAuthUrl(challenge);
    state.verifier = verifier;
    state.challenge = challenge;
    state.oauthUrl = oauthUrl;
  }, [state]);

  React.useEffect(() => {
    state.webview?.addEventListener('did-stop-loading', loadStop);
    state.webview?.addEventListener('will-navigate', redirecting);
    return () => {
      state.webview?.removeEventListener('did-stop-loading', loadStop);
      state.webview?.removeEventListener('will-navigate', redirecting);
    };
  }, [state.oauthUrl]);

  return (
    <div className="bg-white rounded-12 text-center">
      <div className="py-8 px-14 text-center">
        <div className="text-18 font-bold text-gray-700">连接 Mixin 账号</div>
        <div className="text-12 mt-2 text-gray-6d">
          Mixin 扫码以连接钱包
        </div>
        <div className="relative overflow-hidden">
          {state.oauthUrl && (
            <div
              className={classNames(
                {
                  hidden: state.webviewLoading,
                },
                'w-64 h-64',
              )}
            >
              <webview
                src={state.oauthUrl}
                ref={(ref) => { state.webview = ref; }}
              />
              <style jsx>{`
                webview {
                  height: 506px;
                  width: 800px;
                  position: absolute;
                  top: -238px;
                  left: 0;
                  margin-left: ${isWindow ? '-265px' : '-272px'};
                  transform: scale(0.88);
                }
              `}</style>
            </div>
          )}
          {state.webviewLoading && (
            <div className="w-64 h-64 flex items-center justify-center">
              <Loading size={30} />
            </div>
          )}
        </div>
        <div className="flex justify-center mt-2">
          <Button
            outline
            fullWidth
            onClick={() => {
              onClose();
            }}
          >
            取消
          </Button>
        </div>
        <div className="flex justify-center items-center mt-5 text-gray-400 text-12">
          <span className="flex items-center mr-1">
            <MdInfo className="text-16" />
          </span>
          手机还没有安装 Mixin ?
          <a
            className="text-indigo-400 ml-1"
            href="https://mixin.one/messenger"
            target="_blank"
            rel="noopener noreferrer"
          >
            前往下载
          </a>
        </div>
      </div>
    </div>
  );
});

const BindMixinModal = observer((props: BindMixinModalProps) => {
  const { open, onClose } = props;

  return (
    <Dialog open={open} onClose={() => onClose()}>
      <MixinOAuth {...props} />
    </Dialog>
  );
});

const ProfileEditor = observer((props: IProps) => {
  const database = useDatabase();
  const { snackbarStore, activeGroupStore, nodeStore, groupStore } = useStore();
  const state = useLocalObservable(() => ({
    openBindMixinModal: false,
    loading: false,
    done: false,
    applyToAllGroups: false,
    profile: toJS(activeGroupStore.profile),
  }));
  const offChainDatabase = useOffChainDatabase();
  const submitPerson = useSubmitPerson();

  const updateProfile = async () => {
    if (!state.profile.name) {
      snackbarStore.show({
        message: '请输入昵称',
        type: 'error',
      });
      return;
    }
    state.loading = true;
    state.done = false;
    await sleep(400);
    try {
      const groupIds = state.applyToAllGroups
        ? groupStore.groups.map((group) => group.group_id)
        : [activeGroupStore.id];
      for (const groupId of groupIds) {
        const latestPerson = await PersonModel.getUser(database, {
          GroupId: groupId,
          Publisher: nodeStore.info.node_publickey,
          latest: true,
        });
        if (
          latestPerson
          && latestPerson.profile
          && isEqual(latestPerson.profile, toJS(state.profile))
        ) {
          continue;
        }
        await submitPerson({
          groupId,
          publisher: nodeStore.info.node_publickey,
          profile: state.profile,
        });
      }
      if (state.applyToAllGroups) {
        await globalProfileModel.createOrUpdate(offChainDatabase, {
          name: state.profile.name,
          avatar: state.profile.avatar,
          mixinUID: state.profile.mixinUID,
        });
      }
      state.loading = false;
      state.done = true;
      await sleep(300);
      props.onClose();
    } catch (err) {
      console.error(err);
      state.loading = false;
      snackbarStore.show({
        message: '修改失败，貌似哪里出错了',
        type: 'error',
      });
    }
  };

  return (
    <div className="bg-white rounded-12 text-center py-8 px-12">
      <div className="w-78">
        <div className="text-18 font-bold text-gray-700">编辑资料</div>
        <div className="mt-6">
          <div className="flex border border-gray-200 px-8 py-4 rounded-12">
            <div className="flex justify-center mr-5 pb-2">
              <ImageEditor
                roundedFull
                width={200}
                placeholderWidth={90}
                editorPlaceholderWidth={200}
                imageUrl={state.profile.avatar}
                getImageUrl={(url: string) => {
                  state.profile.avatar = url;
                }}
              />
            </div>
            <div className="pt-2">
              <TextField
                className="w-full opacity-80"
                label="昵称"
                size="small"
                value={state.profile.name}
                onChange={(e) => {
                  state.profile.name = e.target.value.trim();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    (e.target as HTMLInputElement).blur();
                    updateProfile();
                  }
                }}
                margin="dense"
                variant="outlined"
              />

              <div
                className="w-full mt-[10px] opacity-50 cursor-pointer hover:opacity-80"
                onClick={() => {
                  state.openBindMixinModal = true;
                }}
              >
                {!state.profile.mixinUID && (
                  <div className="flex items-center pl-1">
                    <Tooltip
                      enterDelay={200}
                      enterNextDelay={200}
                      placement="top"
                      title='连接 Mixin 钱包，用于接收打赏'
                      arrow
                    >
                      <a className="text-12">连接钱包</a>
                    </Tooltip>
                    <GoChevronRight className="text-14 ml-[1px] opacity-90" />
                  </div>
                )}
                {state.profile.mixinUID && (
                  <Tooltip
                    enterDelay={200}
                    enterNextDelay={200}
                    placement="top"
                    title={`已连接 Mixin 钱包，地址是 ${state.profile.mixinUID}`}
                    arrow
                  >
                    <div className="flex items-center relative mt-[-2px] pb-2">
                      <div className="w-7 h-7 flex items-center justify-center border-2 border-gray-88 rounded-full absolute top-0 left-0 z-10 bg-white box-border opacity-80">
                        <BiWallet className="text-16 opacity-90" />
                      </div>
                      <div className="text-12 rounded-full font-bold text-gray-800 pr-4 pl-[33px] h-7 bg-gray-200 flex items-center border border-gray-300 tracking-wide">
                        {state.profile.mixinUID.slice(0, 8)}
                      </div>
                    </div>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
          <div className="w-full mt-6 hidden">
            <div className="p-2 pl-3 border border-black border-opacity-20 text-gray-500 text-12 truncate flex-1 rounded-l-4 border-r-0 hover:border-opacity-100">
              <MiddleTruncate
                string={state.profile.mixinUID || ''}
                length={15}
              />
            </div>
            <Button
              noRound
              className="rounded-r-4"
              size="small"
            >
              连接 Mixin
            </Button>
          </div>
          <Tooltip
            enterDelay={600}
            enterNextDelay={600}
            placement="top"
            title="所有群组都使用这份资料"
            arrow
          >
            <div
              className="flex items-center justify-center mt-5 -ml-2"
              onClick={() => {
                state.applyToAllGroups = !state.applyToAllGroups;
              }}
            >
              <Checkbox checked={state.applyToAllGroups} color="primary" />
              <span className="text-gray-88 text-13 cursor-pointer">
                应用到所有群组
              </span>
            </div>
          </Tooltip>
        </div>

        <div className="mt-2" onClick={updateProfile}>
          <Button fullWidth isDoing={state.loading} isDone={state.done}>
            确定
          </Button>
        </div>
      </div>
      <BindMixinModal
        open={state.openBindMixinModal}
        onBind={(mixinUID: string) => {
          state.profile.mixinUID = mixinUID;
          snackbarStore.show({
            message: '连接成功',
          });
        }}
        onClose={() => {
          state.openBindMixinModal = false;
        }}
      />
    </div>
  );
});

export default observer((props: IProps) => (
  <Dialog
    open={props.open}
    onClose={() => props.onClose()}
    transitionDuration={{
      enter: 300,
    }}
  >
    <ProfileEditor {...props} />
  </Dialog>
));
