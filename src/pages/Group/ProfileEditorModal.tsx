import React from 'react';
import classNames from 'classnames';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Loading from 'components/Loading';
import { TextField, Checkbox } from '@material-ui/core';
import Button from 'components/Button';
import MiddleTruncate from 'components/MiddleTruncate';
import { sleep, isWindow } from 'utils';
import { useStore } from 'store';
import ImageEditor from 'components/ImageEditor';
import getProfile from 'store/selectors/getProfile';
import Tooltip from '@material-ui/core/Tooltip';
import useSubmitPerson from 'hooks/useSubmitPerson';
import { MdInfo } from 'react-icons/md';

interface IProps {
  open: boolean;
  onClose: () => void;
}

interface BindMixinModalProps {
  open: boolean;
  onClose: (done?: boolean) => void;
}

const MixinOAuth = observer((props: BindMixinModalProps) => {
  const loginUrl = `https://mixin-www.zeromesh.net/oauth/authorize?client_id=ef7ba9a7-c0ac-46a7-8ce3-717be19caf9c&scope=PROFILE:READ&response_type=code&redirect_url=${window.location.href}`;
  //const { onClose } = props;
  const state = useLocalObservable(() => ({
    iframeLoading: true,
    iframe: null as null | HTMLIFrameElement,
  }));

  return (
    <div className="bg-white rounded-12 text-center">
      <div className="py-8 px-12 text-center">
        <div className="text-18 font-bold text-gray-700">绑定 Mixin 账号</div>
        <div className="text-12 mt-2 text-gray-6d">
          Mixin 扫码以完成绑定
        </div>
        <div className="relative overflow-hidden">
          {loginUrl && (
            <div
              className={classNames(
                {
                  hidden: state.iframeLoading,
                },
                'w-64 h-64'
              )}
            >
              <iframe
                onLoad={() => {
                  setTimeout(() => {
                    state.iframeLoading = false;
                  }, 1000);
                }}
                src={loginUrl}
                ref={(ref) => { state.iframe = ref; }}
                sandbox="allow-scripts allow-same-origin"
                referrerPolicy="origin-when-cross-origin"
              />
              <style jsx>{`
                iframe {
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
          {state.iframeLoading && (
            <div className="w-64 h-64 flex items-center justify-center">
              <Loading size={30} />
            </div>
          )}
        </div>
        <div className="flex justify-center mt-2">
          <Button
            outline
            fullWidth
            className="mr-4"
            onClick={async () => {
              console.log(state.iframe);
              //onClose();
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
  const { snackbarStore, activeGroupStore, nodeStore, groupStore } = useStore();
  const state = useLocalObservable(() => ({
    openBindMixinModal: false,
    loading: false,
    done: false,
    applyToAllGroups: false,
    profile: getProfile(nodeStore.info.node_publickey, activeGroupStore.person),
  }));
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
    try {
      const groupIds = state.applyToAllGroups
        ? groupStore.groups.map((group) => group.GroupId)
        : [activeGroupStore.id];
      for (const groupId of groupIds) {
        const person = await submitPerson({
          groupId,
          publisher: nodeStore.info.node_publickey,
          profile: state.profile,
        });
        if (activeGroupStore.id === groupId) {
          activeGroupStore.setPerson(person);
          groupStore.setProfileAppliedToAllGroups(state.profile);
        }
      }
      await sleep(400);
      state.loading = false;
      state.done = true;
      props.onClose();
      await sleep(200);
      snackbarStore.show({
        message: '修改成功',
      });
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
      <div className="w-72">
        <div className="text-18 font-bold text-gray-700">编辑资料</div>
        <div className="mt-6">
          <div className="flex justify-center">
            <ImageEditor
              roundedFull
              width={200}
              placeholderWidth={120}
              editorPlaceholderWidth={200}
              imageUrl={state.profile.avatar}
              getImageUrl={(url: string) => {
                state.profile.avatar = url;
              }}
            />
          </div>
          <TextField
            className="w-full px-12 mt-6"
            placeholder="昵称"
            size="small"
            value={state.profile.name}
            onChange={(e) => {
              state.profile.name = e.target.value.trim();
            }}
            onKeyDown={(e: any) => {
              if (e.keyCode === 13) {
                e.preventDefault();
                e.target.blur();
                updateProfile();
              }
            }}
            margin="dense"
            variant="outlined"
          />
          <div className="flex w-full px-12 mt-6">
            <div className="p-2 pl-3 border border-black border-opacity-20 text-gray-500 text-12 truncate flex-1 rounded-l-4 border-r-0 hover:border-opacity-100">
              <MiddleTruncate
                string={nodeStore.info.node_publickey}
                length={15}
              />
            </div>
            <Button
              noRound
              className="rounded-r-4"
              size="small"
              onClick={() => {
                state.openBindMixinModal = true;
              }}
            >
              绑定 Mixin
            </Button>
          </div>
          <Tooltip
            enterDelay={600}
            enterNextDelay={600}
            placement="top"
            title="所有群组都使用这个昵称和头像"
            arrow
          >
            <div
              className="flex items-center justify-center mt-5"
              onClick={() => {
                state.applyToAllGroups = !state.applyToAllGroups;
              }}
            >
              <Checkbox checked={state.applyToAllGroups} color="primary" />
              <span className="text-gray-88 mt-1-px text-13 cursor-pointer">
                应用到所有群组
              </span>
            </div>
          </Tooltip>
        </div>
        <div className="mt-[5px]" onClick={updateProfile}>
          <Button fullWidth isDoing={state.loading} isDone={state.done}>
            确定
          </Button>
        </div>
      </div>
      <BindMixinModal
        //amount={state.mixinConnectionResp.amount}
        //paymentUrl={state.mixinConnectionResp.paymentUrl}
        open={state.openBindMixinModal}
        onClose={async (done) => {
          state.openBindMixinModal =  false;
          //if (done) {
            //await sleep(500);
            //confirmDialogStore.show({
              //content: '这个操作正在上链，等待确认中，预计 3-5 分钟后完成',
              //okText: '我知道了',
              //ok: () => confirmDialogStore.hide(),
              //cancelDisabled: true,
            //});
          //}
        }}
      />
    </div>
  );
});

export default observer((props: IProps) => {
  return (
    <Dialog
      disableBackdropClick={false}
      open={props.open}
      onClose={() => props.onClose()}
      transitionDuration={{
        enter: 300,
      }}
    >
      <ProfileEditor {...props} />
    </Dialog>
  );
});
