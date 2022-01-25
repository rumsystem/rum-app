import React from 'react';
import { runInAction, toJS } from 'mobx';
import classNames from 'classnames';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Loading from 'components/Loading';
import { TextField } from '@material-ui/core';
import Button from 'components/Button';
import { isWindow } from 'utils/env';
import sleep from 'utils/sleep';
import { useStore } from 'store';
import { client_id, getVerifierAndChanllege, getOAuthUrl } from 'utils/mixinOAuth';
import { getAccessToken, getUserProfile } from 'apis/mixin';
import { GroupStatus } from 'apis/group';
import ImageEditor from 'components/ImageEditor';
import Tooltip from '@material-ui/core/Tooltip';
import useSubmitPerson from 'hooks/useSubmitPerson';
import { MdInfo } from 'react-icons/md';
import { BiWallet } from 'react-icons/bi';
import { isEqual } from 'lodash';
import useDatabase from 'hooks/useDatabase';
import * as PersonModel from 'hooks/useDatabase/models/person';
import { GoChevronRight } from 'react-icons/go';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { BsQuestionCircleFill } from 'react-icons/bs';
import useGroupStatusCheck from 'hooks/useGroupStatusCheck';
import { lang } from 'utils/lang';
import fs from 'fs-extra';

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
      message: lang.failToFetchMixinProfile,
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
    <div className="bg-white rounded-0 text-center">
      <div className="py-8 px-14 text-center">
        <div className="text-18 font-bold text-gray-700 flex items-center justify-center">连接 Mixin 账号
          <Tooltip
            enterDelay={200}
            enterNextDelay={200}
            placement="top"
            title={lang.connectMixinPrivacyTip}
            arrow
          >
            <div>
              <BsQuestionCircleFill className="text-16 opacity-60 ml-1" />
            </div>
          </Tooltip>
        </div>
        <div className="text-12 mt-2 text-gray-6d">
          {lang.mixinScanToConnect}
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
            {lang.cancel}
          </Button>
        </div>
        <div className="flex justify-center items-center mt-5 text-gray-400 text-12">
          <span className="flex items-center mr-1">
            <MdInfo className="text-16" />
          </span>
          {lang.noMixinOnYourPhone}
          <a
            className="text-gray-700 ml-1"
            href="https://mixin.one/messenger"
            target="_blank"
            rel="noopener noreferrer"
          >
            {lang.toDownload}
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
  const { snackbarStore, activeGroupStore, groupStore } = useStore();
  const activeGroup = useActiveGroup();
  const state = useLocalObservable(() => ({
    openBindMixinModal: false,
    loading: false,
    done: false,
    profile: toJS(activeGroupStore.profile),
  }));
  const submitPerson = useSubmitPerson();
  const groupStatusCheck = useGroupStatusCheck();

  const updateProfile = async () => {
    if (!state.profile.name) {
      snackbarStore.show({
        message: lang.require(lang.nickname),
        type: 'error',
      });
      return;
    }
    await sleep(400);
    const currentGroupId = activeGroupStore.id;
    const canPost = groupStatusCheck(currentGroupId, true, {
      [GroupStatus.SYNCING]: lang.waitForSyncingDoneToSubmitProfile,
      [GroupStatus.SYNC_FAILED]: lang.syncFailedTipForProfile,
    });
    if (!canPost) {
      return;
    }
    const profile = toJS(state.profile);
    if (profile.avatar.startsWith('file://')) {
      const base64 = await fs.readFile(profile.avatar.replace('file://', ''), { encoding: 'base64' });
      profile.avatar = `data:image/png;base64,${base64}`;
    }
    state.loading = true;
    state.done = false;
    try {
      const groupIds = [currentGroupId];
      for (const groupId of groupIds) {
        const latestPerson = await PersonModel.getUser(database, {
          GroupId: groupId,
          Publisher: activeGroup.user_pubkey,
          latest: true,
        });
        if (
          latestPerson
          && latestPerson.profile
          && isEqual(latestPerson.profile, profile)
        ) {
          continue;
        }
        await submitPerson({
          groupId,
          publisher: groupStore.map[groupId].user_pubkey,
          profile,
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
        message: lang.somethingWrong,
        type: 'error',
      });
    }
  };

  return (
    <div className="bg-white rounded-0 text-center py-8 px-12">
      <div className="w-78">
        <div className="text-18 font-bold text-gray-700">{lang.editProfile}</div>
        <div className="mt-6">
          <div className="flex border border-gray-200 px-6 py-6 rounded-0">
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
                label={lang.nickname}
                size="small"
                value={state.profile.name}
                onChange={(e) => {
                  state.profile.name = e.target.value.trim().slice(0, 40);
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
                      title={lang.connectMixinForTip}
                      arrow
                    >
                      <a className="text-12">{lang.connectWallet}</a>
                    </Tooltip>
                    <GoChevronRight className="text-14 ml-[1px] opacity-90" />
                  </div>
                )}
                {state.profile.mixinUID && (
                  <Tooltip
                    enterDelay={200}
                    enterNextDelay={200}
                    placement="top"
                    title={lang.connectedMixinId(state.profile.mixinUID)}
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
        </div>

        <div className="mt-10" onClick={updateProfile}>
          <Button className="w-36" isDoing={state.loading} isDone={state.done}>
            {lang.yes}
          </Button>
        </div>
      </div>
      <BindMixinModal
        open={state.openBindMixinModal}
        onBind={(mixinUID: string) => {
          state.profile.mixinUID = mixinUID;
          snackbarStore.show({
            message: lang.connected,
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
